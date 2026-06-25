import type { EventPayload } from '@/packages/types/events'
import { loggers } from '@/packages/lib/logger'
import { syncStorageBucketSubscriptions } from '@/packages/lib/storage/sync-buckets'
import type { HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('storage-sync')

export const storageHandlers: HandlerMap = {
  'storage.sync-buckets': [
    async (_payload: EventPayload<'storage.sync-buckets'>) => {
      try {
        logger.info('Starting storage bucket sync with Stripe')

        const stats = await syncStorageBucketSubscriptions()

        logger.info('Storage bucket sync completed', {
          totalSubscriptions: stats.totalSubscriptions,
          provisioned: stats.provisioned,
          skipped: stats.skipped,
          failed: stats.failed,
          deprovisioned: stats.deprovisioned,
          duration: stats.duration,
        })
      } catch (error) {
        logger.error('Storage bucket sync failed', error as Error)
        throw error
      }
    },
  ],
}
