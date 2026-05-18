import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import { loggers } from '@/packages/lib/logger'
import { createObjectStorageBucket } from '@/packages/lib/vultr'

const logger = loggers.storage

function isBucketAlreadyExistsError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /already exists|exists/i.test(message)
}

export interface ProvisionBucketOptions {
  userId: string
  email: string | null
  name: string | null
  stripeSubscriptionId: string
  region?: string | null
  tierSlug?: string | null
}

export async function provisionBucketForUserSubscription(
  opts: ProvisionBucketOptions,
): Promise<{ storageBucketId: string; bucketName: string; region: string; created: boolean }> {
  const { userId, email, name, stripeSubscriptionId, region, tierSlug } = opts

  // Idempotency: if a bucket already exists for this subscription, just ensure assignment.
  const existing = await prisma.storageBucket.findUnique({
    where: { stripeSubscriptionId },
    select: { id: true, s3Bucket: true, s3Region: true },
  })

  if (existing) {
    await prisma.user.update({ where: { id: userId }, data: { storageBucketId: existing.id } })
    return {
      storageBucketId: existing.id,
      bucketName: existing.s3Bucket,
      region: existing.s3Region,
      created: false,
    }
  }

  const tierWord = tierSlug ?? null

  let vultrInstance = region
    ? tierWord
      ? await prisma.vultrObjectStorage.findFirst({
          where: {
            region,
            status: 'active',
            tier: { contains: tierWord, mode: 'insensitive' },
          },
          orderBy: { createdAt: 'asc' },
        })
      : await prisma.vultrObjectStorage.findFirst({
          where: { region, status: 'active' },
          orderBy: { createdAt: 'asc' },
        })
    : null

  if (!vultrInstance && tierWord) {
    vultrInstance = await prisma.vultrObjectStorage.findFirst({
      where: {
        status: 'active',
        tier: { contains: tierWord, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  if (!vultrInstance) {
    vultrInstance = await prisma.vultrObjectStorage.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    })
  }

  if (!vultrInstance) {
    throw new Error('No active Vultr Object Storage pool is available for provisioning')
  }

  const resolvedRegion = vultrInstance.region
  const bucketName = `emberly-${userId.slice(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '')}`

  try {
    await createObjectStorageBucket(vultrInstance.vultrId, bucketName)
    logger.info(`[Provision] Created Vultr bucket '${bucketName}' in instance ${vultrInstance.vultrId}`)
  } catch (err) {
    if (!isBucketAlreadyExistsError(err)) {
      throw err
    }
    logger.warn(`[Provision] Vultr bucket '${bucketName}' already exists; continuing with DB assignment`)
  }

  const storageBucket = await prisma.storageBucket.upsert({
    where: { stripeSubscriptionId },
    create: {
      name: `${name || email || userId}'s Bucket (${resolvedRegion.toUpperCase()})`,
      provider: 's3',
      s3Bucket: bucketName,
      s3Region: resolvedRegion,
      s3AccessKeyId: vultrInstance.s3AccessKey,
      s3SecretKey: vultrInstance.s3SecretKey,
      s3Endpoint: `https://${vultrInstance.s3Hostname}`,
      s3ForcePathStyle: false,
      vultrObjectStorageId: vultrInstance.id,
      vultrBucketName: bucketName,
      stripeSubscriptionId,
      provisionStatus: 'active',
    },
    update: {
      name: `${name || email || userId}'s Bucket (${resolvedRegion.toUpperCase()})`,
      provider: 's3',
      s3Bucket: bucketName,
      s3Region: resolvedRegion,
      s3AccessKeyId: vultrInstance.s3AccessKey,
      s3SecretKey: vultrInstance.s3SecretKey,
      s3Endpoint: `https://${vultrInstance.s3Hostname}`,
      s3ForcePathStyle: false,
      vultrObjectStorageId: vultrInstance.id,
      vultrBucketName: bucketName,
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
    s3Hostname: vultrInstance.s3Hostname,
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
