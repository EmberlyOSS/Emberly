import type {
  BaseEvent,
  EventHandlerFunction,
  EventHandlerOptions,
  EventHandlerRegistration,
  EventProcessingResult,
  EventType,
} from '@/packages/types/events'
import { EventStatus } from '@/packages/types/events'

import { eventCache } from '@/packages/lib/cache/event-cache'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

import { eventEmitter } from './emitter'

const logger = loggers.events.getChildLogger('consumer')

export class EventConsumer {
  private static instance: EventConsumer | null = null
  private handlers: Map<string, EventHandlerFunction> = new Map()
  private handlerOptions: Map<string, EventHandlerOptions> = new Map()
  private processing: Set<string> = new Set()

  // Track handlers that need to be synced to DB
  private pendingDbSync: Array<{ eventType: string; handlerName: string; enabled: boolean }> = []
  private dbSyncScheduled = false

  private constructor() { }

  static getInstance(): EventConsumer {
    if (!EventConsumer.instance) {
      EventConsumer.instance = new EventConsumer()
    }
    return EventConsumer.instance
  }

  /**
   * Register a handler - stores in memory immediately, syncs to Redis/DB in background
   * This is intentionally fast and non-blocking for startup performance
   */
  registerHandler<T extends EventType>(
    eventType: T,
    handlerName: string,
    handler: EventHandlerFunction,
    options: EventHandlerOptions = {}
  ): EventHandlerRegistration {
    const handlerKey = `${eventType}:${handlerName}`
    const enabled = options.enabled ?? true

    // Store in memory immediately (synchronous - this is the source of truth for runtime)
    this.handlers.set(handlerKey, handler)
    this.handlerOptions.set(handlerKey, {
      enabled,
      maxConcurrency: 1,
      retryDelay: 1000,
      timeout: 30000,
      ...options,
    })

    // Queue for background DB sync
    this.pendingDbSync.push({ eventType, handlerName, enabled })

    // Return a mock registration (actual DB record will be created in background)
    return {
      id: handlerKey,
      eventType,
      handler: handlerName,
      enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EventHandlerRegistration
  }

  /**
   * Sync all registered handlers to Redis cache and DB
   * Call this once after all handlers are registered
   */
  async syncHandlersToStorage(): Promise<void> {
    if (this.pendingDbSync.length === 0) {
      return
    }

    const handlersToSync = [...this.pendingDbSync]
    this.pendingDbSync = []

    const startTime = Date.now()

    // 1. Cache to Redis first (fast, in-memory)
    try {
      await eventCache.cacheHandlers(handlersToSync)
      logger.debug(`Cached ${handlersToSync.length} handlers to Redis`)
    } catch (error) {
      logger.warn('Failed to cache handlers to Redis', { error })
      // Continue - Redis is optional
    }

    // 2. Sync to DB in small batches to avoid transaction timeout
    // With 74 handlers, we'll do ~8 batches of 10
    const BATCH_SIZE = 10
    let dbSynced = 0
    let dbErrors = 0

    for (let i = 0; i < handlersToSync.length; i += BATCH_SIZE) {
      const batch = handlersToSync.slice(i, i + BATCH_SIZE)

      try {
        await prisma.$transaction(
          batch.map((h) =>
            prisma.eventHandler.upsert({
              where: {
                eventType_handler: {
                  eventType: h.eventType,
                  handler: h.handlerName,
                },
              },
              update: {
                enabled: h.enabled,
                updatedAt: new Date(),
              },
              create: {
                eventType: h.eventType,
                handler: h.handlerName,
                enabled: h.enabled,
              },
            })
          ),
          { timeout: 10000 } // 10 second timeout per batch
        )
        dbSynced += batch.length
      } catch (error) {
        dbErrors += batch.length
        logger.warn(`Failed to sync batch ${Math.floor(i / BATCH_SIZE) + 1} to DB`, { error })
        // Continue with other batches
      }
    }

    const duration = Date.now() - startTime
    if (dbErrors === 0) {
      logger.debug(`Synced ${dbSynced} handlers to DB`, { duration })
    } else {
      logger.warn(`Synced ${dbSynced} handlers to DB, ${dbErrors} failed`, { duration })
    }
  }

  /**
   * Get the number of registered handlers (in-memory)
   */
  getHandlerCount(): number {
    return this.handlers.size
  }

  async unregisterHandler(
    eventType: string,
    handlerName: string
  ): Promise<boolean> {
    const handlerKey = `${eventType}:${handlerName}`

    this.handlers.delete(handlerKey)
    this.handlerOptions.delete(handlerKey)

    try {
      await prisma.eventHandler.delete({
        where: {
          eventType_handler: {
            eventType,
            handler: handlerName,
          },
        },
      })

      logger.info('Event handler unregistered', { eventType, handlerName })
      return true
    } catch (error) {
      logger.error('Failed to unregister handler', error as Error, {
        eventType,
        handlerName,
      })
      return false
    }
  }

  async enableHandler(
    eventType: string,
    handlerName: string
  ): Promise<boolean> {
    const handlerKey = `${eventType}:${handlerName}`

    const options = this.handlerOptions.get(handlerKey)
    if (options) {
      options.enabled = true
    }

    try {
      await prisma.eventHandler.update({
        where: {
          eventType_handler: {
            eventType,
            handler: handlerName,
          },
        },
        data: {
          enabled: true,
          updatedAt: new Date(),
        },
      })

      logger.info('Event handler enabled', { eventType, handlerName })
      return true
    } catch (error) {
      logger.error('Failed to enable handler', error as Error, {
        eventType,
        handlerName,
      })
      return false
    }
  }

  async disableHandler(
    eventType: string,
    handlerName: string
  ): Promise<boolean> {
    const handlerKey = `${eventType}:${handlerName}`

    const options = this.handlerOptions.get(handlerKey)
    if (options) {
      options.enabled = false
    }

    try {
      await prisma.eventHandler.update({
        where: {
          eventType_handler: {
            eventType,
            handler: handlerName,
          },
        },
        data: {
          enabled: false,
          updatedAt: new Date(),
        },
      })

      logger.info('Event handler disabled', { eventType, handlerName })
      return true
    } catch (error) {
      logger.error('Failed to disable handler', error as Error, {
        eventType,
        handlerName,
      })
      return false
    }
  }

  async processEvent(event: BaseEvent): Promise<EventProcessingResult> {
    const isAlreadyProcessing = this.processing.has(event.id)
    const isRedisProcessing = await eventCache.isProcessing(event.id)

    if (isAlreadyProcessing || isRedisProcessing) {
      return { success: false, error: 'Event is already being processed' }
    }

    this.processing.add(event.id)
    await eventCache.markProcessing(event.id, 300) // 5 minute lock

    try {
      await eventEmitter.updateEventStatus(event.id, EventStatus.PROCESSING)

      const eventHandlers = await prisma.eventHandler.findMany({
        where: {
          eventType: event.type,
          enabled: true,
        },
      })

      if (eventHandlers.length === 0) {
        logger.trace('No handlers found for event type', {
          eventType: event.type,
          eventId: event.id,
        })
        await eventEmitter.updateEventStatus(event.id, EventStatus.COMPLETED)
        return { success: true }
      }

      // Execute handlers sequentially to avoid large parallel workloads
      const handlerErrors: string[] = []
      for (const handler of eventHandlers) {
        try {
          await this.executeHandler(event, handler)
        } catch (err) {
          handlerErrors.push((err as Error)?.message || 'Unknown error')
        }
      }

      if (handlerErrors.length > 0) {
        const combinedError = handlerErrors.join('; ')
        await eventEmitter.updateEventStatus(event.id, EventStatus.FAILED, combinedError)
        return {
          success: false,
          error: combinedError,
          shouldRetry: event.retryCount < event.maxRetries,
        }
      }

      await eventEmitter.updateEventStatus(event.id, EventStatus.COMPLETED)
      return { success: true }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      await eventEmitter.updateEventStatus(
        event.id,
        EventStatus.FAILED,
        errorMessage
      )

      return {
        success: false,
        error: errorMessage,
        shouldRetry: event.retryCount < event.maxRetries,
      }
    } finally {
      this.processing.delete(event.id)
      await eventCache.unmarkProcessing(event.id)
    }
  }

  private async executeHandler(
    event: BaseEvent,
    handlerRegistration: EventHandlerRegistration
  ): Promise<void> {
    const handlerKey = `${event.type}:${handlerRegistration.handler}`
    const handler = this.handlers.get(handlerKey)
    const options = this.handlerOptions.get(handlerKey)

    if (!handler) {
      const registeredHandlers = Array.from(this.handlers.keys())
      logger.error('Handler not found in memory', {
        handlerKey,
        registeredHandlers,
        eventId: event.id,
      })
      throw new Error(`Handler not found: ${handlerKey}. Registered handlers: ${registeredHandlers.length}. This usually means the event system hasn't finished initializing. The event will be retried.`)
    }

    if (!options?.enabled) {
      throw new Error(`Handler disabled: ${handlerKey}`)
    }

    const timeout = options.timeout || 30000

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Handler timeout: ${handlerKey}`))
      }, timeout)

      Promise.resolve(handler(event.payload, event))
        .then(() => {
          clearTimeout(timer)
          resolve()
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  async retryFailedEvent(eventId: string): Promise<boolean> {
    const event = await eventEmitter.getEvent(eventId)

    if (!event) {
      logger.error('Event not found for retry', { eventId })
      return false
    }

    if (event.status !== EventStatus.FAILED) {
      logger.error('Event is not in failed state', {
        eventId,
        currentStatus: event.status,
      })
      return false
    }

    if (event.retryCount >= event.maxRetries) {
      logger.warn('Event has exceeded max retries', {
        eventId,
        retryCount: event.retryCount,
        maxRetries: event.maxRetries,
      })
      return false
    }

    await eventEmitter.incrementRetryCount(eventId)
    await eventEmitter.updateEventStatus(eventId, EventStatus.PENDING)

    logger.info('Event queued for retry', {
      eventId,
      retryCount: event.retryCount + 1,
    })
    return true
  }

  async getHandlers(): Promise<EventHandlerRegistration[]> {
    const handlers = await prisma.eventHandler.findMany({
      orderBy: [{ eventType: 'asc' }, { handler: 'asc' }],
    })

    return handlers as EventHandlerRegistration[]
  }

  async getHandlersByEventType(
    eventType: string
  ): Promise<EventHandlerRegistration[]> {
    const handlers = await prisma.eventHandler.findMany({
      where: {
        eventType,
      },
      orderBy: {
        handler: 'asc',
      },
    })

    return handlers as EventHandlerRegistration[]
  }

  isProcessing(eventId: string): boolean {
    return this.processing.has(eventId)
  }

  getProcessingEvents(): string[] {
    return Array.from(this.processing)
  }
}

export const eventConsumer = EventConsumer.getInstance()
