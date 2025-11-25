import { loggers } from '@/lib/logger'

import { registerFileExpiryHandlers } from './handlers/file-expiry'
import { events } from './index'

const logger = loggers.events

let initialized = false

export async function initializeEventSystem() {
  if (initialized) {
    logger.debug('Event system already initialized')
    return
  }

  try {
    logger.info('Initializing event system...')

    await registerFileExpiryHandlers()

    // Decide whether to start the in-process event worker.
    // Controlled by `EMBERLY_RUN_EVENT_WORKER` environment variable:
    // - 'true'  => always start
    // - 'false' => never start
    // - unset   => start by default in non-production, skip in production
    const env = process.env.EMBERLY_RUN_EVENT_WORKER
    const shouldStartWorker =
      env === 'true' ||
      (env !== 'false' && process.env.NODE_ENV !== 'production')

    if (shouldStartWorker) {
      // Start worker asynchronously (fire-and-forget) so initialization
      // doesn't block server startup. Log any start errors.
      events
        .startWorker({
          batchSize: 10,
          pollInterval: 5000,
          maxConcurrency: 3,
          enableScheduledEvents: true,
        })
        .then(() => logger.info('Event worker started'))
        .catch((err) =>
          logger.error('Failed to start event worker', err as Error)
        )
    } else {
      logger.info('Event worker start skipped (env control)')
    }

    initialized = true
    logger.info('Event system initialized successfully')

    // Fetch stats but don't let failures block initialization
    events
      .getStats()
      .then((stats) => logger.info('Event queue stats', { stats }))
      .catch((err) => logger.debug('Failed to fetch event stats', { err }))
  } catch (error) {
    logger.error('Failed to initialize event system', error as Error)
    throw error
  }
}

export function isEventSystemInitialized(): boolean {
  return initialized
}
