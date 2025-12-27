import type { BaseEvent, EventWorkerOptions } from '@/packages/types/events'
import { EventStatus } from '@/packages/types/events'

import { eventCache } from '@/packages/lib/cache/event-cache'
import { withRetry } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

import { eventConsumer } from './consumer'
import { eventEmitter } from './emitter'

const logger = loggers.events.getChildLogger('worker')

interface WorkerStats {
  isRunning: boolean
  startedAt: Date | null
  eventsProcessed: number
  eventsSucceeded: number
  eventsFailed: number
  eventsRetried: number
  lastProcessedAt: Date | null
  avgProcessingTime: number
  currentBatch: number
  consecutiveErrors: number
  lastErrorAt: Date | null
}

export class EventWorker {
  private static instance: EventWorker | null = null
  private running = false
  private intervalId: NodeJS.Timeout | null = null
  private stats: WorkerStats = {
    isRunning: false,
    startedAt: null,
    eventsProcessed: 0,
    eventsSucceeded: 0,
    eventsFailed: 0,
    eventsRetried: 0,
    lastProcessedAt: null,
    avgProcessingTime: 0,
    currentBatch: 0,
    consecutiveErrors: 0,
    lastErrorAt: null,
  }
  private processingTimes: number[] = []
  // Adaptive polling: increase interval when idle, decrease when busy
  private consecutiveEmptyPolls = 0
  private basePollInterval = process.env.NODE_ENV === 'development' ? 5000 : 2000
  private currentPollInterval = process.env.NODE_ENV === 'development' ? 5000 : 2000
  private maxPollInterval = process.env.NODE_ENV === 'development' ? 60000 : 30000
  private minPollInterval = process.env.NODE_ENV === 'development' ? 3000 : 1000

  // Circuit breaker state
  private circuitBreakerOpen = false
  private circuitBreakerOpenedAt: Date | null = null
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5 // Open after 5 consecutive errors
  private readonly CIRCUIT_BREAKER_RESET_MS = 30000 // Try to recover after 30s

  private constructor() { }

  static getInstance(): EventWorker {
    if (!EventWorker.instance) {
      EventWorker.instance = new EventWorker()
    }
    return EventWorker.instance
  }

  async start(options: EventWorkerOptions = {}): Promise<void> {
    if (this.running) {
      logger.warn('Event worker is already running')
      return
    }

    const {
      batchSize = 5,
      pollInterval = 5000,
      maxConcurrency = 1,
      enableScheduledEvents = true,
    } = options

    this.running = true
    this.stats.isRunning = true
    this.stats.startedAt = new Date()
    this.basePollInterval = pollInterval
    this.currentPollInterval = pollInterval

    logger.info('Starting event worker', {
      batchSize,
      pollInterval,
      maxConcurrency,
      enableScheduledEvents,
    })

    // Use adaptive polling instead of fixed interval
    this.scheduleNextPoll(batchSize, maxConcurrency, enableScheduledEvents)

    logger.info('Event worker started successfully')
  }

  private scheduleNextPoll(
    batchSize: number,
    maxConcurrency: number,
    enableScheduledEvents: boolean
  ): void {
    if (!this.running) return

    this.intervalId = setTimeout(async () => {
      // Check circuit breaker
      if (this.circuitBreakerOpen) {
        const elapsed = Date.now() - (this.circuitBreakerOpenedAt?.getTime() ?? 0)
        if (elapsed < this.CIRCUIT_BREAKER_RESET_MS) {
          // Still in cooldown - schedule next poll with long interval
          this.currentPollInterval = this.maxPollInterval
          this.scheduleNextPoll(batchSize, maxConcurrency, enableScheduledEvents)
          return
        }
        // Try to recover
        logger.info('Circuit breaker: attempting recovery')
        this.circuitBreakerOpen = false
        this.stats.consecutiveErrors = 0
      }

      try {
        const eventsProcessed = await this.processEvents(batchSize, maxConcurrency)

        // Reset error state on success
        this.stats.consecutiveErrors = 0

        // Adaptive polling: adjust interval based on activity
        if (eventsProcessed === 0) {
          this.consecutiveEmptyPolls++
          this.currentPollInterval = Math.min(
            this.basePollInterval * Math.pow(1.3, Math.min(this.consecutiveEmptyPolls, 6)),
            this.maxPollInterval
          )
        } else {
          this.consecutiveEmptyPolls = 0
          this.currentPollInterval = Math.max(this.basePollInterval, this.minPollInterval)
        }

        if (enableScheduledEvents) {
          await this.activateScheduledEvents()
        }
      } catch (error) {
        this.stats.consecutiveErrors++
        this.stats.lastErrorAt = new Date()

        // Only log error occasionally to avoid spam
        if (this.stats.consecutiveErrors === 1 || this.stats.consecutiveErrors % 10 === 0) {
          logger.error('Error in event worker', error as Error, {
            consecutiveErrors: this.stats.consecutiveErrors,
          })
        }

        // Check if we should open circuit breaker
        if (this.stats.consecutiveErrors >= this.CIRCUIT_BREAKER_THRESHOLD) {
          this.circuitBreakerOpen = true
          this.circuitBreakerOpenedAt = new Date()
          logger.warn('Circuit breaker opened due to consecutive errors', {
            consecutiveErrors: this.stats.consecutiveErrors,
            resetAfterMs: this.CIRCUIT_BREAKER_RESET_MS,
          })
        }

        // Exponential backoff on errors
        this.consecutiveEmptyPolls++
        this.currentPollInterval = Math.min(
          this.basePollInterval * Math.pow(1.5, Math.min(this.consecutiveEmptyPolls, 5)),
          this.maxPollInterval
        )
      }

      // Schedule next poll with adaptive interval
      this.scheduleNextPoll(batchSize, maxConcurrency, enableScheduledEvents)
    }, this.currentPollInterval)
  }

  async stop(): Promise<void> {
    if (!this.running) {
      logger.warn('Event worker is not running')
      return
    }

    this.running = false
    this.stats.isRunning = false

    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }

    // Reset adaptive polling state
    this.consecutiveEmptyPolls = 0
    this.currentPollInterval = this.basePollInterval

    logger.info('Event worker stopped')
  }

  isRunning(): boolean {
    return this.running
  }

  getStats(): WorkerStats {
    return { ...this.stats }
  }

  private async processEvents(
    batchSize: number,
    maxConcurrency: number
  ): Promise<number> {
    let eventsProcessed = 0

    // Try to get events from Redis cache first (instant)
    for (let i = 0; i < batchSize; i++) {
      const event = await eventCache.dequeueEvent(EventStatus.PENDING)
      if (!event) break

      await this.processEventWithStats(event)
      eventsProcessed++
    }

    // If no Redis events, fall back to database with retry logic
    if (eventsProcessed === 0) {
      const events = await withRetry(
        () => eventEmitter.getEvents({
          status: EventStatus.PENDING,
          limit: batchSize,
        }),
        3,
        1000
      )

      if (events.length > 0) {
        this.stats.currentBatch = events.length
        // Limit concurrency by processing events in small chunks
        for (let i = 0; i < events.length; i += maxConcurrency) {
          const chunk = events.slice(i, i + maxConcurrency)
          await Promise.all(chunk.map((event) => this.processEventWithStats(event)))
        }
        eventsProcessed = events.length
      }
    } else {
      this.stats.currentBatch = eventsProcessed
    }

    return eventsProcessed
  }

  private async processEventWithStats(event: BaseEvent): Promise<void> {
    const startTime = Date.now()

    try {
      const result = await eventConsumer.processEvent(event)
      const processingTime = Date.now() - startTime

      this.updateProcessingTime(processingTime)
      this.stats.eventsProcessed++
      this.stats.lastProcessedAt = new Date()

      if (result.success) {
        this.stats.eventsSucceeded++
      } else {
        this.stats.eventsFailed++

        if (result.shouldRetry) {
          const retrySuccess = await eventConsumer.retryFailedEvent(event.id)
          if (retrySuccess) {
            this.stats.eventsRetried++
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to process event ${event.id}`, error as Error)
      this.stats.eventsFailed++
    }
  }

  private async activateScheduledEvents(): Promise<void> {
    try {
      const activatedCount = await eventEmitter.activateScheduledEvents()

      if (activatedCount > 0) {
        logger.debug(`Activated ${activatedCount} scheduled events`)
      }
    } catch (error) {
      logger.error('Error activating scheduled events', error as Error)
    }
  }

  private updateProcessingTime(time: number): void {
    this.processingTimes.push(time)

    if (this.processingTimes.length > 100) {
      this.processingTimes.shift()
    }

    const sum = this.processingTimes.reduce((a, b) => a + b, 0)
    this.stats.avgProcessingTime = sum / this.processingTimes.length
  }

  async processRetryableEvents(): Promise<void> {
    const failedEvents = await eventEmitter.getEvents({
      status: EventStatus.FAILED,
      limit: 50,
    })

    const retryableEvents = failedEvents.filter(
      (event) => event.retryCount < event.maxRetries
    )

    for (const event of retryableEvents) {
      await eventConsumer.retryFailedEvent(event.id)
    }

    logger.info(`Queued ${retryableEvents.length} events for retry`)
  }

  async cleanupOldEvents(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const deletedCount = await eventEmitter.deleteEvents({
      status: EventStatus.COMPLETED,
      createdBefore: cutoffDate,
      excludeAuditable: true, // Never delete auditable events
    })

    logger.info(`Cleaned up ${deletedCount} old completed events`)
    return deletedCount
  }

  async cleanupFailedEvents(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const deletedCount = await eventEmitter.deleteEvents({
      status: EventStatus.FAILED,
      createdBefore: cutoffDate,
      excludeAuditable: true, // Never delete auditable events
    })

    logger.info(`Cleaned up ${deletedCount} old failed events`)
    return deletedCount
  }

  async resetStats(): Promise<void> {
    this.stats.eventsProcessed = 0
    this.stats.eventsSucceeded = 0
    this.stats.eventsFailed = 0
    this.stats.eventsRetried = 0
    this.stats.lastProcessedAt = null
    this.stats.avgProcessingTime = 0
    this.stats.currentBatch = 0
    this.processingTimes = []
  }
}

export const eventWorker = EventWorker.getInstance()
