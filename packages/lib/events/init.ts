import { Worker } from 'bullmq'
import { loggers } from '@/packages/lib/logger'
import { bullmqConnection } from './bullmq/connection'
import { eventQueue } from './bullmq/queue'
import { createProcessor } from './bullmq/processor'
import { allHandlers } from './handlers'

const logger = loggers.events

let worker: Worker | null = null
let initialized = false

export async function initializeEventSystem(): Promise<void> {
  if (initialized) {
    logger.debug('Event system already initialized')
    return
  }

  const startTime = Date.now()

  try {
    logger.debug('Initializing event system...')

    const env = process.env.EMBERLY_RUN_EVENT_WORKER
    const shouldStartWorker =
      env === 'true' ||
      (env !== 'false' && process.env.NODE_ENV !== 'production')

    if (shouldStartWorker) {
      const processor = createProcessor(allHandlers)
      worker = new Worker('emberly-events', processor, {
        connection: bullmqConnection,
        concurrency: 5,
      })

      worker.on('completed', (job) => {
        logger.debug('Job completed', { type: job.name, jobId: job.id })
      })

      worker.on('failed', (job, err) => {
        logger.error('Job failed', err, {
          type: job?.name,
          jobId: job?.id,
          attempt: job?.attemptsMade,
        })
      })

      logger.info('BullMQ worker started')
    } else {
      logger.debug('Event worker start skipped (env control)')
    }

    if (process.env.NODE_ENV !== 'test') {
      await schedulePeriodicJobs()
    }

    initialized = true
    const duration = Date.now() - startTime
    logger.info('Event system initialized', {
      duration,
      handlerTypes: allHandlers.size,
    })
  } catch (error) {
    logger.error('Failed to initialize event system', error as Error)
    throw error
  }
}

async function schedulePeriodicJobs(): Promise<void> {
  try {
    await eventQueue.add(
      'storage.sync-buckets',
      { _trigger: 'periodic' },
      {
        repeat: { pattern: '0 * * * *' },
        jobId: 'storage-sync-periodic',
      }
    )
    logger.info('Periodic storage sync job scheduled (hourly)')
  } catch (error) {
    logger.error('Failed to schedule periodic jobs', error as Error)
  }
}

export async function shutdownEventSystem(): Promise<void> {
  if (worker) {
    await worker.close()
    worker = null
    logger.info('BullMQ worker stopped')
  }
  initialized = false
}

export function isEventSystemInitialized(): boolean {
  return initialized
}
