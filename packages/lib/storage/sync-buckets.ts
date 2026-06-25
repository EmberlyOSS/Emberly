/**
 * Bucket Synchronization Worker
 *
 * Handles periodic reconciliation between Stripe subscriptions and provisioned
 * storage buckets. Ensures users with active storage-bucket subscriptions have
 * corresponding database records and properly assigned buckets.
 */

import {
  getStripeClient,
  isStripeConfigured,
} from '@/packages/lib/stripe/client'
import { prisma } from '@/packages/lib/database/prisma'
import { provisionBucketForUserSubscription } from './bucket-provisioning'
import { deleteObjectStorageBucket } from '@/packages/lib/storage/providers/vultr'
import { deleteLinodeBucket } from '@/packages/lib/storage/providers/linode'
import { deleteOVHStorageContainer } from '@/packages/lib/storage/providers/ovhcloud'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.storage.getChildLogger('sync-buckets')

export interface BucketSyncStats {
  totalSubscriptions: number
  provisioned: number
  skipped: number
  failed: number
  deprovisioned: number
  duration: number
}

/**
 * Delete a bucket from its provider using the pool's metadata.
 * Errors are non-fatal — the caller handles them.
 */
async function deprovisionBucketOnProvider(
  pool: {
    provider: string
    externalId: string
    metadata: unknown
  },
  bucketName: string
): Promise<void> {
  switch (pool.provider) {
    case 'vultr':
      await deleteObjectStorageBucket(pool.externalId, bucketName)
      break
    case 'linode': {
      const meta = pool.metadata as { linodeClusterId?: string } | null
      if (!meta?.linodeClusterId)
        throw new Error('Linode pool missing metadata.linodeClusterId')
      await deleteLinodeBucket(meta.linodeClusterId, bucketName)
      break
    }
    case 'ovhcloud': {
      const meta = pool.metadata as {
        projectId?: string
        regionName?: string
      } | null
      if (!meta?.projectId || !meta?.regionName)
        throw new Error(
          'OVHcloud pool missing metadata.projectId or metadata.regionName'
        )
      await deleteOVHStorageContainer(
        meta.projectId,
        meta.regionName,
        bucketName
      )
      break
    }
    default:
      throw new Error(`Unknown pool provider: "${pool.provider}"`)
  }
}

/**
 * Sync all active storage-bucket subscriptions from Stripe.
 * Provisions buckets for any subscriptions that are missing database records.
 */
export async function syncStorageBucketSubscriptions(): Promise<BucketSyncStats> {
  const startTime = Date.now()
  const stats: BucketSyncStats = {
    totalSubscriptions: 0,
    provisioned: 0,
    skipped: 0,
    failed: 0,
    deprovisioned: 0,
    duration: 0,
  }

  if (!(await isStripeConfigured())) {
    logger.warn('[Sync] Stripe not configured, skipping bucket sync')
    return stats
  }

  try {
    const stripe = await getStripeClient()

    logger.info('[Sync] Starting bucket synchronization')

    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const subscriptions = await stripe.subscriptions.list(
        {
          status: 'active',
          limit: 100,
          ...(startingAfter && { starting_after: startingAfter }),
        },
        { maxNetworkRetries: 2 }
      )

      for (const sub of subscriptions.data) {
        stats.totalSubscriptions++

        try {
          const metadata = sub.metadata || {}
          if (metadata.type !== 'storage-bucket') {
            stats.skipped++
            continue
          }

          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: sub.customer as string },
          })

          if (!user) {
            logger.warn(
              `[Sync] No user found for Stripe customer ${sub.customer}`
            )
            stats.failed++
            continue
          }

          const existing = await prisma.storageBucket.findUnique({
            where: { stripeSubscriptionId: sub.id },
          })

          if (existing) {
            if (user.storageBucketId !== existing.id) {
              await prisma.user.update({
                where: { id: user.id },
                data: { storageBucketId: existing.id },
              })
              logger.info(`[Sync] Reassigned bucket to user ${user.id}`, {
                bucketId: existing.id,
              })
            }
            stats.skipped++
            continue
          }

          logger.info(`[Sync] Provisioning bucket for user ${user.id}`, {
            subscriptionId: sub.id,
            location: metadata.location,
          })

          try {
            await provisionBucketForUserSubscription({
              userId: user.id,
              email: user.email,
              name: user.name,
              stripeSubscriptionId: sub.id,
              region: (metadata.location as string) || undefined,
              tierSlug: (metadata.tier as string) || undefined,
            })
            stats.provisioned++
            logger.info(
              `[Sync] Successfully provisioned bucket for user ${user.id}`
            )
          } catch (err) {
            logger.error(
              `[Sync] Failed to provision bucket for user ${user.id}`,
              err as Error,
              {
                subscriptionId: sub.id,
              }
            )
            stats.failed++
          }
        } catch (err) {
          logger.error(
            `[Sync] Error processing subscription ${sub.id}`,
            err as Error
          )
          stats.failed++
        }
      }

      hasMore = subscriptions.has_more
      if (hasMore && subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id
      }
    }

    await reconcileDeprovisionedBuckets()

    stats.duration = Date.now() - startTime
    logger.info('[Sync] Bucket synchronization completed', { ...stats })
    return stats
  } catch (err) {
    logger.error('[Sync] Bucket synchronization failed', err as Error)
    stats.duration = Date.now() - startTime
    throw err
  }
}

/**
 * Check for storage buckets whose Stripe subscriptions no longer exist or are
 * cancelled, and deprovision them on the provider + mark them inactive.
 */
async function reconcileDeprovisionedBuckets(): Promise<void> {
  try {
    const stripe = await getStripeClient()

    const bucketsWithSubs = await prisma.storageBucket.findMany({
      where: {
        stripeSubscriptionId: { not: null },
        provisionStatus: 'active',
      },
      select: {
        id: true,
        stripeSubscriptionId: true,
        objectStoragePoolId: true,
        poolBucketName: true,
      },
    })

    for (const bucket of bucketsWithSubs) {
      if (!bucket.stripeSubscriptionId) continue

      try {
        const sub = await stripe.subscriptions.retrieve(
          bucket.stripeSubscriptionId,
          {
            maxNetworkRetries: 1,
          }
        )

        if (sub.status === 'canceled' || sub.status === 'incomplete_expired') {
          logger.info(`[Sync] Marking bucket ${bucket.id} for deprovisioning`, {
            subscriptionStatus: sub.status,
          })
          await deprovisionBucket(bucket)
        }
      } catch (err: any) {
        if (err?.statusCode === 404) {
          logger.info(
            `[Sync] Subscription ${bucket.stripeSubscriptionId} no longer exists`
          )
          await deprovisionBucket(bucket)
        } else {
          logger.error(
            `[Sync] Error checking subscription ${bucket.stripeSubscriptionId}`,
            err as Error
          )
        }
      }
    }
  } catch (err) {
    logger.error(
      '[Sync] Reconciliation of deprovisioned buckets failed',
      err as Error
    )
    // Non-critical — don't rethrow
  }
}

async function deprovisionBucket(bucket: {
  id: string
  stripeSubscriptionId: string | null
  objectStoragePoolId: string | null
  poolBucketName: string | null
}): Promise<void> {
  if (bucket.objectStoragePoolId && bucket.poolBucketName) {
    try {
      const pool = await prisma.objectStoragePool.findUnique({
        where: { id: bucket.objectStoragePoolId },
      })
      if (pool) {
        await deprovisionBucketOnProvider(pool, bucket.poolBucketName)
        logger.info(
          `[Sync] Deleted bucket ${bucket.poolBucketName} from ${pool.provider} pool ${pool.id}`
        )
      }
    } catch (err) {
      logger.warn(
        `[Sync] Failed to delete bucket ${bucket.poolBucketName} from provider`,
        {
          error: String(err),
        }
      )
    }
  }

  await prisma.$transaction([
    prisma.storageBucket.update({
      where: { id: bucket.id },
      data: { provisionStatus: 'deprovisioning' },
    }),
    ...(bucket.stripeSubscriptionId
      ? [
          prisma.subscription.updateMany({
            where: {
              stripeSubscriptionId: bucket.stripeSubscriptionId,
              status: 'active',
            },
            data: { status: 'canceled', cancelAtPeriodEnd: false },
          }),
        ]
      : []),
    prisma.user.updateMany({
      where: { storageBucketId: bucket.id },
      data: { storageBucketId: null },
    }),
  ])
}
