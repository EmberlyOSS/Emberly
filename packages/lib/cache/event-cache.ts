import type { BaseEvent } from '@/packages/types/events'
import { EventStatus } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'

import { getRedisClient, isRedisConnected, redisKeys } from './redis'

const logger = loggers.events.getChildLogger('event-cache')

export class EventCache {
    private static instance: EventCache | null = null

    private constructor() { }

    static getInstance(): EventCache {
        if (!EventCache.instance) {
            EventCache.instance = new EventCache()
        }
        return EventCache.instance
    }

    /**
     * Add event to queue in Redis
     * Falls back to returning false if Redis unavailable
     */
    async enqueueEvent(event: BaseEvent): Promise<boolean> {
        if (!isRedisConnected()) {
            return false
        }

        try {
            const client = await getRedisClient()
            const queueKey = redisKeys.eventQueue(event.status)
            const eventJson = JSON.stringify(event)

            await client.lPush(queueKey, eventJson)

            // Set expiration based on status
            const ttl = this.getTTLForStatus(event.status)
            await client.expire(queueKey, ttl)

            logger.debug('Event enqueued to Redis', {
                eventId: event.id,
                status: event.status,
            })

            return true
        } catch (error) {
            logger.error('Failed to enqueue event to Redis', error as Error)
            return false
        }
    }

    /**
     * Get next pending event from Redis queue
     * Returns null if queue empty or Redis unavailable
     */
    async dequeueEvent(
        status: EventStatus = EventStatus.PENDING
    ): Promise<BaseEvent | null> {
        if (!isRedisConnected()) {
            return null
        }

        try {
            const client = await getRedisClient()
            const queueKey = redisKeys.eventQueue(status)
            const eventJson = await client.rPop(queueKey)

            if (!eventJson) {
                return null
            }

            const event = JSON.parse(eventJson) as BaseEvent
            return event
        } catch (error) {
            logger.error('Failed to dequeue event from Redis', error as Error)
            return null
        }
    }

    /**
     * Get all events from queue without removing them
     */
    async peekQueuedEvents(
        status: EventStatus = EventStatus.PENDING,
        count: number = 10
    ): Promise<BaseEvent[]> {
        if (!isRedisConnected()) {
            return []
        }

        try {
            const client = await getRedisClient()
            const queueKey = redisKeys.eventQueue(status)
            const eventJsons = await client.lRange(queueKey, 0, count - 1)

            return eventJsons.map((json) => JSON.parse(json) as BaseEvent)
        } catch (error) {
            logger.error('Failed to peek queue', error as Error)
            return []
        }
    }

    /**
     * Get queue depth
     */
    async getQueueDepth(status: EventStatus = EventStatus.PENDING): Promise<number> {
        if (!isRedisConnected()) {
            return 0
        }

        try {
            const client = await getRedisClient()
            const queueKey = redisKeys.eventQueue(status)
            const depth = await client.lLen(queueKey)
            return depth
        } catch (error) {
            logger.error('Failed to get queue depth', error as Error)
            return 0
        }
    }

    /**
     * Track processing event
     */
    async markProcessing(eventId: string, ttl: number = 300): Promise<void> {
        if (!isRedisConnected()) {
            return
        }

        try {
            const client = await getRedisClient()
            const lockKey = redisKeys.eventLock(eventId)
            const processingKey = redisKeys.eventProcessing()

            // Add to processing set
            await client.sAdd(processingKey, eventId)

            // Set expiration on lock (prevents deadlocks)
            await client.setEx(lockKey, ttl, '1')

            logger.debug('Event marked as processing', { eventId })
        } catch (error) {
            logger.error('Failed to mark event processing', error as Error)
        }
    }

    /**
     * Remove from processing
     */
    async unmarkProcessing(eventId: string): Promise<void> {
        if (!isRedisConnected()) {
            return
        }

        try {
            const client = await getRedisClient()
            const lockKey = redisKeys.eventLock(eventId)
            const processingKey = redisKeys.eventProcessing()

            await client.sRem(processingKey, eventId)
            await client.del(lockKey)

            logger.debug('Event unmarked as processing', { eventId })
        } catch (error) {
            logger.error('Failed to unmark event processing', error as Error)
        }
    }

    /**
     * Check if event is being processed
     */
    async isProcessing(eventId: string): Promise<boolean> {
        if (!isRedisConnected()) {
            return false
        }

        try {
            const client = await getRedisClient()
            const lockKey = redisKeys.eventLock(eventId)
            const exists = await client.exists(lockKey)
            return exists === 1
        } catch (error) {
            logger.error('Failed to check processing status', error as Error)
            return false
        }
    }

    /**
     * Get all processing events
     */
    async getProcessingEvents(): Promise<string[]> {
        if (!isRedisConnected()) {
            return []
        }

        try {
            const client = await getRedisClient()
            const processingKey = redisKeys.eventProcessing()
            return await client.sMembers(processingKey)
        } catch (error) {
            logger.error('Failed to get processing events', error as Error)
            return []
        }
    }

    /**
     * Update cached stats
     */
    async updateStats(stats: Record<string, number>): Promise<void> {
        if (!isRedisConnected()) {
            return
        }

        try {
            const client = await getRedisClient()
            const statsKey = redisKeys.eventStats()

            // Delete old stats
            await client.del(statsKey)

            // Set new stats with short TTL
            await client.hSet(
                statsKey,
                stats as Record<string, string | number | Buffer>
            )
            await client.expire(statsKey, 30) // 30 second cache

            logger.debug('Event stats cached', { stats })
        } catch (error) {
            logger.error('Failed to update stats cache', error as Error)
        }
    }

    /**
     * Get cached stats
     */
    async getStats(): Promise<Record<string, number> | null> {
        if (!isRedisConnected()) {
            return null
        }

        try {
            const client = await getRedisClient()
            const statsKey = redisKeys.eventStats()
            const stats = await client.hGetAll(statsKey)

            if (Object.keys(stats).length === 0) {
                return null
            }

            // Convert string values to numbers
            const numStats: Record<string, number> = {}
            for (const [key, value] of Object.entries(stats)) {
                numStats[key] = parseInt(value, 10)
            }
            return numStats
        } catch (error) {
            logger.error('Failed to get cached stats', error as Error)
            return null
        }
    }

    /**
     * Cache handler registry
     */
    async cacheHandlers(
        handlers: Array<{ eventType: string; handler: string; enabled: boolean }>
    ): Promise<void> {
        if (!isRedisConnected()) {
            return
        }

        try {
            const client = await getRedisClient()
            const registryKey = redisKeys.handlerRegistry()

            // Clear old registry
            await client.del(registryKey)

            // Cache handlers
            for (const h of handlers) {
                const key = `${h.eventType}:${h.handler}`
                const value = h.enabled ? '1' : '0'
                await client.hSet(registryKey, key, value)
            }

            // Cache by type for faster lookups
            for (const eventType of [...new Set(handlers.map((h) => h.eventType))]) {
                const typeKey = redisKeys.handlersByType(eventType)
                const typeHandlers = handlers
                    .filter((h) => h.eventType === eventType && h.enabled)
                    .map((h) => h.handler)

                await client.del(typeKey)
                if (typeHandlers.length > 0) {
                    await client.lPush(typeKey, typeHandlers)
                    await client.expire(typeKey, 3600) // 1 hour TTL
                }
            }

            await client.expire(registryKey, 3600) // 1 hour TTL
            logger.debug('Handler registry cached', { count: handlers.length })
        } catch (error) {
            logger.error('Failed to cache handlers', error as Error)
        }
    }

    /**
     * Get handlers for event type from cache
     */
    async getHandlersForType(eventType: string): Promise<string[] | null> {
        if (!isRedisConnected()) {
            return null
        }

        try {
            const client = await getRedisClient()
            const typeKey = redisKeys.handlersByType(eventType)
            const handlers = await client.lRange(typeKey, 0, -1)

            return handlers.length > 0 ? handlers : null
        } catch (error) {
            logger.error('Failed to get cached handlers', error as Error)
            return null
        }
    }

    /**
     * Clear all event caches
     */
    async clearAll(): Promise<void> {
        if (!isRedisConnected()) {
            return
        }

        try {
            const client = await getRedisClient()

            // Get all keys matching pattern
            const keys = await client.keys('emberly:*')

            if (keys.length > 0) {
                await client.del(keys)
                logger.info('Cleared all event caches', { count: keys.length })
            }
        } catch (error) {
            logger.error('Failed to clear caches', error as Error)
        }
    }

    private getTTLForStatus(status: string): number {
        // Different TTLs for different statuses
        switch (status) {
            case EventStatus.PENDING:
                return 3600 // 1 hour
            case EventStatus.SCHEDULED:
                return 86400 // 24 hours
            case EventStatus.PROCESSING:
                return 300 // 5 minutes
            case EventStatus.COMPLETED:
                return 86400 // 24 hours
            case EventStatus.FAILED:
                return 604800 // 7 days
            default:
                return 3600
        }
    }
}

export const eventCache = EventCache.getInstance()
