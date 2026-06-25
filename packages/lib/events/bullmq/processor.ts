import type { Job } from 'bullmq'
import type { EventType } from '@/packages/types/events'
import { loggers } from '@/packages/lib/logger'
const logger = loggers.events.getChildLogger('processor')

type AnyHandlerFn = (payload: any, job: Job) => Promise<void> | void

export function createProcessor(handlers: Map<EventType, AnyHandlerFn[]>) {
  return async function process(job: Job): Promise<void> {
    const eventType = job.name as EventType
    const fns = handlers.get(eventType)

    if (!fns || fns.length === 0) {
      logger.debug('No handlers registered for event type', { type: eventType })
      return
    }

    logger.debug('Processing event', {
      type: eventType,
      jobId: job.id,
      attempt: job.attemptsMade,
    })

    const errors: Error[] = []
    for (const fn of fns) {
      try {
        await fn(job.data, job)
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Handler failed', err, { type: eventType, jobId: job.id })
        errors.push(err)
      }
    }

    if (errors.length > 0) {
      throw errors[0]
    }
  }
}
