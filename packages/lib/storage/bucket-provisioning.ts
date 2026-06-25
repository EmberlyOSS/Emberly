import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import { loggers } from '@/packages/lib/logger'
import { createObjectStorageBucket } from '@/packages/lib/storage/providers/vultr'
import { createLinodeBucket } from '@/packages/lib/storage/providers/linode'
import { createOVHStorageContainer } from '@/packages/lib/storage/providers/ovhcloud'

const logger = loggers.storage

function isBucketAlreadyExistsError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /already exists|exists|conflict/i.test(message)
}

export interface ProvisionBucketOptions {
  userId: string
  email: string | null
  name: string | null
  stripeSubscriptionId: string
  region?: string | null
  tierSlug?: string | null
}

/**
 * Create the actual bucket/container on the provider using the pool's credentials.
 * Returns the bucket name used (may differ from requested for uniqueness).
 */
async function provisionBucketOnProvider(
  pool: {
    id: string
    provider: string
    externalId: string
    s3AccessKey: string
    s3SecretKey: string
    s3Hostname: string
    metadata: unknown
  },
  bucketName: string
): Promise<void> {
  switch (pool.provider) {
    case 'vultr': {
      // externalId is the Vultr Object Storage instance UUID
      await createObjectStorageBucket(pool.externalId, bucketName)
      break
    }
    case 'linode': {
      // metadata.linodeClusterId is the cluster (region) ID, e.g. "us-east-1"
      const meta = pool.metadata as { linodeClusterId?: string } | null
      const clusterId = meta?.linodeClusterId
      if (!clusterId)
        throw new Error(
          `Linode pool ${pool.id} is missing metadata.linodeClusterId`
        )
      await createLinodeBucket(clusterId, bucketName)
      break
    }
    case 'ovhcloud': {
      // metadata.projectId and metadata.regionName identify the OVH pool
      const meta = pool.metadata as {
        projectId?: string
        regionName?: string
      } | null
      if (!meta?.projectId || !meta?.regionName)
        throw new Error(
          `OVHcloud pool ${pool.id} is missing metadata.projectId or metadata.regionName`
        )
      await createOVHStorageContainer(
        meta.projectId,
        meta.regionName,
        bucketName
      )
      break
    }
    default:
      throw new Error(`Unknown storage pool provider: "${pool.provider}"`)
  }
}

export async function provisionBucketForUserSubscription(
  opts: ProvisionBucketOptions
): Promise<{
  storageBucketId: string
  bucketName: string
  region: string
  created: boolean
}> {
  const { userId, email, name, stripeSubscriptionId, region, tierSlug } = opts

  // Idempotency: if a bucket already exists for this subscription, re-assign and return.
  const existing = await prisma.storageBucket.findUnique({
    where: { stripeSubscriptionId },
    select: { id: true, s3Bucket: true, s3Region: true },
  })

  if (existing) {
    await prisma.user.update({
      where: { id: userId },
      data: { storageBucketId: existing.id },
    })
    return {
      storageBucketId: existing.id,
      bucketName: existing.s3Bucket,
      region: existing.s3Region,
      created: false,
    }
  }

  const tierWord = tierSlug ?? null

  // Find the best-matching ObjectStoragePool: prefer region+tier match, then
  // region-only, then tier-only, then any active pool.
  let pool = region
    ? tierWord
      ? await prisma.objectStoragePool.findFirst({
          where: {
            region,
            status: 'active',
            tier: { contains: tierWord, mode: 'insensitive' },
          },
          orderBy: { createdAt: 'asc' },
        })
      : await prisma.objectStoragePool.findFirst({
          where: { region, status: 'active' },
          orderBy: { createdAt: 'asc' },
        })
    : null

  if (!pool && tierWord) {
    pool = await prisma.objectStoragePool.findFirst({
      where: {
        status: 'active',
        tier: { contains: tierWord, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  if (!pool) {
    pool = await prisma.objectStoragePool.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    })
  }

  if (!pool) {
    throw new Error(
      'No active Object Storage pool is available for provisioning'
    )
  }

  const resolvedRegion = pool.region
  const bucketName = `emberly-${userId
    .slice(0, 20)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')}`

  try {
    await provisionBucketOnProvider(pool, bucketName)
    logger.info(
      `[Provision] Created bucket '${bucketName}' via ${pool.provider} pool ${pool.id}`
    )
  } catch (err) {
    if (!isBucketAlreadyExistsError(err)) {
      throw err
    }
    logger.warn(
      `[Provision] Bucket '${bucketName}' already exists in pool ${pool.id}; continuing with DB assignment`
    )
  }

  const storageBucket = await prisma.storageBucket.upsert({
    where: { stripeSubscriptionId },
    create: {
      name: `${name || email || userId}'s Bucket (${resolvedRegion.toUpperCase()})`,
      provider: 's3',
      s3Bucket: bucketName,
      s3Region: resolvedRegion,
      s3AccessKeyId: pool.s3AccessKey,
      s3SecretKey: pool.s3SecretKey,
      s3Endpoint: `https://${pool.s3Hostname}`,
      s3ForcePathStyle: false,
      objectStoragePoolId: pool.id,
      poolBucketName: bucketName,
      stripeSubscriptionId,
      provisionStatus: 'active',
    },
    update: {
      name: `${name || email || userId}'s Bucket (${resolvedRegion.toUpperCase()})`,
      provider: 's3',
      s3Bucket: bucketName,
      s3Region: resolvedRegion,
      s3AccessKeyId: pool.s3AccessKey,
      s3SecretKey: pool.s3SecretKey,
      s3Endpoint: `https://${pool.s3Hostname}`,
      s3ForcePathStyle: false,
      objectStoragePoolId: pool.id,
      poolBucketName: bucketName,
      provisionStatus: 'active',
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { storageBucketId: storageBucket.id },
  })

  await events.emit('user.bucket-provisioned', {
    userId,
    email: email || '',
    region: resolvedRegion,
    bucketName,
    s3Hostname: pool.s3Hostname,
    storageBucketId: storageBucket.id,
  })

  if (email) {
    await events.emit('email.send', {
      to: email,
      userId,
      sourceEvent: 'user.bucket-provisioned',
      template: 'bucket-credentials',
      subject: 'Your Emberly Object Storage bucket is ready',
      variables: {
        bucketName: storageBucket.name,
        s3Bucket: storageBucket.s3Bucket,
        s3Region: storageBucket.s3Region,
        s3AccessKeyId: storageBucket.s3AccessKeyId,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://embrly.ca'}/dashboard/bucket`,
      },
    })
  }

  logger.info(`[Provision] Bucket provisioned and assigned to user ${userId}`)

  return {
    storageBucketId: storageBucket.id,
    bucketName,
    region: resolvedRegion,
    created: true,
  }
}
