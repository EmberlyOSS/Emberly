import { loggers } from '@/packages/lib/logger'

import { getRedisClient, isRedisConnected, redisKeys } from './redis'

const logger = loggers.events.getChildLogger('config-cache')

// Config cache TTL: 30 seconds in dev, 5 minutes in production
const CONFIG_TTL_SECONDS = process.env.NODE_ENV === 'production' ? 5 * 60 : 30

// Setup status cache TTL: same as config
const SETUP_TTL_SECONDS = CONFIG_TTL_SECONDS

/**
 * Redis-based config and setup status cache
 */
export const configCache = {
    /**
     * Get cached config
     */
    async getConfig<T>(): Promise<T | null> {
        if (!isRedisConnected()) return null

        try {
            const redis = await getRedisClient()
            const data = await redis.get(redisKeys.config())
            if (!data) return null
            return JSON.parse(data) as T
        } catch (error) {
            logger.error('Failed to get cached config', error as Error)
            return null
        }
    },

    /**
     * Cache config
     */
    async setConfig<T>(config: T): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.setEx(redisKeys.config(), CONFIG_TTL_SECONDS, JSON.stringify(config))
            return true
        } catch (error) {
            logger.error('Failed to cache config', error as Error)
            return false
        }
    },

    /**
     * Invalidate config cache
     */
    async invalidateConfig(): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.del(redisKeys.config())
            logger.debug('Config cache invalidated')
            return true
        } catch (error) {
            logger.error('Failed to invalidate config cache', error as Error)
            return false
        }
    },

    /**
     * Get cached setup status
     */
    async getSetupStatus(): Promise<boolean | null> {
        if (!isRedisConnected()) return null

        try {
            const redis = await getRedisClient()
            const data = await redis.get(redisKeys.setupStatus())
            if (data === null) return null
            return data === 'true'
        } catch (error) {
            logger.error('Failed to get cached setup status', error as Error)
            return null
        }
    },

    /**
     * Cache setup status
     */
    async setSetupStatus(isComplete: boolean): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.setEx(redisKeys.setupStatus(), SETUP_TTL_SECONDS, isComplete.toString())
            return true
        } catch (error) {
            logger.error('Failed to cache setup status', error as Error)
            return false
        }
    },

    /**
     * Invalidate setup status cache
     */
    async invalidateSetupStatus(): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.del(redisKeys.setupStatus())
            logger.debug('Setup status cache invalidated')
            return true
        } catch (error) {
            logger.error('Failed to invalidate setup status cache', error as Error)
            return false
        }
    },
}
