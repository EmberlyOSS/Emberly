import { loggers } from '@/packages/lib/logger'

import { getRedisClient, isRedisConnected, redisKeys } from './redis'

const logger = loggers.events.getChildLogger('cache')

/**
 * General purpose Redis cache for arbitrary key-value storage
 */
export const generalCache = {
    /**
     * Get a cached value
     */
    async get<T>(key: string): Promise<T | null> {
        if (!isRedisConnected()) return null

        try {
            const redis = await getRedisClient()
            const data = await redis.get(redisKeys.cache(key))
            if (!data) return null
            return JSON.parse(data) as T
        } catch (error) {
            logger.error('Failed to get cache value', error as Error, { key })
            return null
        }
    },

    /**
     * Set a cached value with optional TTL
     */
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            const data = JSON.stringify(value)

            if (ttlSeconds) {
                await redis.setEx(redisKeys.cache(key), ttlSeconds, data)
            } else {
                await redis.set(redisKeys.cache(key), data)
            }
            return true
        } catch (error) {
            logger.error('Failed to set cache value', error as Error, { key })
            return false
        }
    },

    /**
     * Delete a cached value
     */
    async delete(key: string): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.del(redisKeys.cache(key))
            return true
        } catch (error) {
            logger.error('Failed to delete cache value', error as Error, { key })
            return false
        }
    },

    /**
     * Check if a key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            const result = await redis.exists(redisKeys.cache(key))
            return result === 1
        } catch (error) {
            logger.error('Failed to check cache existence', error as Error, { key })
            return false
        }
    },

    /**
     * Get or set a cached value (cache-aside pattern)
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttlSeconds?: number
    ): Promise<T> {
        const cached = await this.get<T>(key)
        if (cached !== null) return cached

        const value = await factory()
        await this.set(key, value, ttlSeconds)
        return value
    },
}
