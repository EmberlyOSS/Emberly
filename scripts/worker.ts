import { Worker } from 'bullmq'
import { loggers } from '@/packages/lib/logger'
import { bullmqConnection } from '@/packages/lib/events/bullmq/connection'
import { createProcessor } from '@/packages/lib/events/bullmq/processor'
import { allHandlers } from '@/packages/lib/events/handlers'

const logger = loggers.events

async function main() {
  logger.info('Starting standalone BullMQ worker...')

  const processor = createProcessor(allHandlers)
  const worker = new Worker('emberly-events', processor, {
    connection: bullmqConnection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
  })

  worker.on('completed', (job) => {
    logger.info('Job completed', { type: job.name, jobId: job.id })
  })

  worker.on('failed', (job, err) => {
    logger.error('Job failed', err, {
      type: job?.name,
      jobId: job?.id,
      attempt: job?.attemptsMade,
    })
  })

  worker.on('error', (err) => {
    logger.error('Worker error', err)
  })

  logger.info('Worker ready', {
    queue: 'emberly-events',
    concurrency: worker.opts.concurrency,
    handlerTypes: allHandlers.size,
  })

  const shutdown = async () => {
    logger.info('Shutting down worker...')
    await worker.close()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch((err) => {
  console.error('Worker failed to start:', err)
  process.exit(1)
})
