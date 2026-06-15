/**
 * Bucket Synchronization Worker
 *
 * This module handles periodic reconciliation between Stripe subscriptions
 * and provisioned storage buckets. It ensures users with active storage-bucket
 * subscriptions have corresponding database records and properly assigned buckets.
 */

import {
  getStripeClient,
  isStripeConfigured,
} from '@/packages/lib/stripe/client'
import { prisma } from '@/packages/lib/database/prisma'
import { provisionBucketForUserSubscription } from './bucket-provisioning'
import { deleteObjectStorageBucket } from '@/packages/lib/vultr'
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

    // Fetch all active storage-bucket subscriptions from Stripe
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
          // Check if this is a storage-bucket subscription
          const metadata = sub.metadata || {}
          const isStorageBucket = metadata.type === 'storage-bucket'

          if (!isStorageBucket) {
            stats.skipped++
            continue
          }

          // Find the user
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

          // Check if bucket already provisioned
          const existing = await prisma.storageBucket.findUnique({
            where: { stripeSubscriptionId: sub.id },
          })

          if (existing) {
            // Ensure user has this bucket assigned
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

          // Provision the bucket
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
              { subscriptionId: sub.id }
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

      // Check for pagination
      hasMore = subscriptions.has_more
      if (hasMore && subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id
      }
    }

    // Optional: deprovision buckets for subscriptions that no longer exist
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
 * Check for storage buckets whose Stripe subscriptions no longer exist.
 * These should be deprovisioned or marked as inactive.
 */
async function reconcileDeprovisionedBuckets(): Promise<void> {
  try {
    const stripe = await getStripeClient()

    // Find all buckets with Stripe subscription IDs
    const bucketsWithSubs = await prisma.storageBucket.findMany({
      where: {
        stripeSubscriptionId: { not: null },
        provisionStatus: 'active',
      },
      select: {
        id: true,
        stripeSubscriptionId: true,
        vultrObjectStorageId: true,
        vultrBucketName: true,
      },
    })

    for (const bucket of bucketsWithSubs) {
      if (!bucket.stripeSubscriptionId) continue

      try {
        // Check if subscription still exists in Stripe
        const sub = await stripe.subscriptions.retrieve(
          bucket.stripeSubscriptionId,
          { maxNetworkRetries: 1 }
        )

        // If subscription is cancelled or incomplete, mark bucket for deprovisioning
        if (sub.status === 'canceled' || sub.status === 'incomplete_expired') {
          logger.info(`[Sync] Marking bucket ${bucket.id} for deprovisioning`, {
            subscriptionStatus: sub.status,
          })

          // Attempt to delete from Vultr if applicable
          if (bucket.vultrObjectStorageId && bucket.vultrBucketName) {
            try {
              const vultrInstance = await prisma.vultrObjectStorage.findUnique({
                where: { id: bucket.vultrObjectStorageId },
              })

              if (vultrInstance) {
                await deleteObjectStorageBucket(
                  vultrInstance.vultrId,
                  bucket.vultrBucketName
                )
                logger.info(
                  `[Sync] Deleted Vultr bucket ${bucket.vultrBucketName}`
                )
              }
            } catch (err) {
              logger.warn(
                `[Sync] Failed to delete Vultr bucket ${bucket.vultrBucketName}`,
                { error: String(err) }
              )
            }
          }

          // Mark as deprovisioned and update the Subscription record so
          // getPlanLimits stops granting unlimited access. This is the recovery
          // path for cases where the webhook failed to fire or was not processed.
          await prisma.$transaction([
            prisma.storageBucket.update({
              where: { id: bucket.id },
              data: { provisionStatus: 'deprovisioning' },
            }),
            prisma.subscription.updateMany({
              where: {
                stripeSubscriptionId: bucket.stripeSubscriptionId,
                status: 'active',
              },
              data: { status: 'canceled', cancelAtPeriodEnd: false },
            }),
            prisma.user.updateMany({
              where: { storageBucketId: bucket.id },
              data: { storageBucketId: null },
            }),
          ])
        }
      } catch (err: any) {
        // 404 means subscription doesn't exist
        if (err?.statusCode === 404) {
          logger.info(
            `[Sync] Subscription ${bucket.stripeSubscriptionId} no longer exists`
          )

          // Deprovision this bucket
          if (bucket.vultrObjectStorageId && bucket.vultrBucketName) {
            try {
              const vultrInstance = await prisma.vultrObjectStorage.findUnique({
                where: { id: bucket.vultrObjectStorageId },
              })

              if (vultrInstance) {
                await deleteObjectStorageBucket(
                  vultrInstance.vultrId,
                  bucket.vultrBucketName
                )
              }
            } catch (deleteErr) {
              logger.warn(
                `[Sync] Failed to delete Vultr bucket ${bucket.vultrBucketName}`,
                { error: String(deleteErr) }
              )
            }
          }

          await prisma.$transaction([
            prisma.storageBucket.update({
              where: { id: bucket.id },
              data: { provisionStatus: 'deprovisioning' },
            }),
            prisma.subscription.updateMany({
              where: {
                stripeSubscriptionId: bucket.stripeSubscriptionId,
                status: 'active',
              },
              data: { status: 'canceled', cancelAtPeriodEnd: false },
            }),
            prisma.user.updateMany({
              where: { storageBucketId: bucket.id },
              data: { storageBucketId: null },
            }),
          ])
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
    // Don't throw - this is a non-critical operation
  }
}
