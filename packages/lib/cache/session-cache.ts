import { loggers } from '@/packages/lib/logger'

import { getRedisClient, isRedisConnected, redisKeys } from './redis'

const logger = loggers.events.getChildLogger('session-cache')

// Session cache TTL: 5 minutes
const SESSION_TTL_SECONDS = 5 * 60

// User lookup cache TTL: 2 minutes (shorter since user data changes more)
const USER_LOOKUP_TTL_SECONDS = 2 * 60

export interface CachedUserSession {
    id: string
    email: string | null
    name: string | null
    role: string
    image: string | null
    sessionVersion: number
    urlId: string
    storageUsed: number
    storageQuotaMB: number | null
    randomizeFileUrls: boolean
    preferredUploadDomain: string | null
}

/**
 * Redis-based session and user cache for auth lookups
 */
export const sessionCache = {
    /**
     * Get cached user session data
     */
    async getUserSession(userId: string): Promise<CachedUserSession | null> {
        if (!isRedisConnected()) return null

        try {
            const redis = await getRedisClient()
            const data = await redis.get(redisKeys.userSession(userId))
            if (!data) return null
            return JSON.parse(data) as CachedUserSession
        } catch (error) {
            logger.error('Failed to get cached user session', error as Error, { userId })
            return null
        }
    },

    /**
     * Cache user session data
     */
    async setUserSession(userId: string, session: CachedUserSession): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.setEx(
                redisKeys.userSession(userId),
                SESSION_TTL_SECONDS,
                JSON.stringify(session)
            )
            return true
        } catch (error) {
            logger.error('Failed to cache user session', error as Error, { userId })
            return false
        }
    },

    /**
     * Invalidate user session cache
     */
    async invalidateUserSession(userId: string): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.del(redisKeys.userSession(userId))
            logger.debug('User session cache invalidated', { userId })
            return true
        } catch (error) {
            logger.error('Failed to invalidate user session', error as Error, { userId })
            return false
        }
    },

    /**
     * Cache user ID by email for fast lookups
     */
    async setUserByEmail(email: string, userId: string): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.setEx(redisKeys.userByEmail(email), USER_LOOKUP_TTL_SECONDS, userId)
            return true
        } catch (error) {
            logger.error('Failed to cache user by email', error as Error, { email })
            return false
        }
    },

    /**
     * Get cached user ID by email
     */
    async getUserByEmail(email: string): Promise<string | null> {
        if (!isRedisConnected()) return null

        try {
            const redis = await getRedisClient()
            return await redis.get(redisKeys.userByEmail(email))
        } catch (error) {
            logger.error('Failed to get user by email from cache', error as Error, { email })
            return null
        }
    },

    /**
     * Cache user data by upload token
     */
    async setUserByToken(token: string, userId: string): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.setEx(redisKeys.userByToken(token), USER_LOOKUP_TTL_SECONDS, userId)
            return true
        } catch (error) {
            logger.error('Failed to cache user by token', error as Error)
            return false
        }
    },

    /**
     * Get cached user ID by upload token
     */
    async getUserByToken(token: string): Promise<string | null> {
        if (!isRedisConnected()) return null

        try {
            const redis = await getRedisClient()
            return await redis.get(redisKeys.userByToken(token))
        } catch (error) {
            logger.error('Failed to get user by token from cache', error as Error)
            return null
        }
    },

    /**
     * Invalidate user by token cache
     */
    async invalidateUserByToken(token: string): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.del(redisKeys.userByToken(token))
            return true
        } catch (error) {
            logger.error('Failed to invalidate user by token cache', error as Error)
            return false
        }
    },

    /**
     * Invalidate all caches for a user
     */
    async invalidateAllForUser(userId: string, email?: string, token?: string): Promise<void> {
        await this.invalidateUserSession(userId)
        if (email) {
            await this.invalidateUserByEmail(email)
        }
        if (token) {
            await this.invalidateUserByToken(token)
        }
    },

    /**
     * Invalidate user by email cache
     */
    async invalidateUserByEmail(email: string): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.del(redisKeys.userByEmail(email))
            return true
        } catch (error) {
            logger.error('Failed to invalidate user by email cache', error as Error, { email })
            return false
        }
    },
}
