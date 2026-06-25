import { Queue } from 'bullmq'
import type {
  EventEmissionOptions,
  EventPayload,
  EventType,
} from '@/packages/types/events'

import { bullmqConnection } from './connection'

export const eventQueue = new Queue('emberly-events', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 86400 }, // keep completed jobs 24h
    removeOnFail: { age: 7 * 86400 }, // keep failed jobs 7d
  },
})

export async function emit<T extends EventType>(
  type: T,
  payload: EventPayload<T>,
  options: EventEmissionOptions = {}
): Promise<void> {
  await eventQueue.add(type, payload, {
    priority: options.priority,
    delay:
      options.scheduledAt && options.scheduledAt > new Date()
        ? options.scheduledAt.getTime() - Date.now()
        : undefined,
    attempts: options.maxRetries ?? 3,
  })
}

export async function schedule<T extends EventType>(
  type: T,
  payload: EventPayload<T>,
  scheduledAt: Date,
  options: Omit<EventEmissionOptions, 'scheduledAt'> = {}
): Promise<void> {
  await emit(type, payload, { ...options, scheduledAt })
}
