import { loggers } from '@/packages/lib/logger'

import { registerAllHandlers } from './handlers'
import { events } from './index'

const logger = loggers.events

let initialized = false

export async function initializeEventSystem() {
  if (initialized) {
    logger.debug('Event system already initialized')
    return
  }

  const startTime = Date.now()

  try {
    logger.debug('Initializing event system...')

    // Register all event handlers (auth, account, email, audit, file, billing, security, admin)
    await registerAllHandlers()

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
          batchSize: 3,
          pollInterval: 5000,
          maxConcurrency: 1,
          enableScheduledEvents: true,
        })
        .then(() => logger.debug('Event worker started'))
        .catch((err) =>
          logger.error('Failed to start event worker', err as Error)
        )
    } else {
      logger.debug('Event worker start skipped (env control)')
    }

    initialized = true
    const duration = Date.now() - startTime
    logger.info('Event system initialized', { duration })

    // Fetch stats but don't let failures block initialization
    // Initial fetch might timeout during heavy startup, which is fine
    setTimeout(() => {
      events
        .getStats()
        .then((stats) => logger.debug('Event queue stats', { stats }))
        .catch(() => { /* silent fail on startup */ })
    }, 5000)
  } catch (error) {
    logger.error('Failed to initialize event system', error as Error)
    throw error
  }
}

export function isEventSystemInitialized(): boolean {
  return initialized
}
