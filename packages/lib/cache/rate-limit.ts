import { loggers } from '@/packages/lib/logger'

import { getRedisClient, isRedisConnected, redisKeys } from './redis'

const logger = loggers.events.getChildLogger('rate-limit')

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: number
}

/**
 * Redis-based rate limiting
 */
export const rateLimiter = {
    /**
     * Check rate limit using sliding window algorithm
     * @param key Unique identifier (e.g., IP address, user ID, endpoint)
     * @param maxRequests Maximum requests allowed in the window
     * @param windowSeconds Time window in seconds
     */
    async check(
        key: string,
        maxRequests: number,
        windowSeconds: number
    ): Promise<RateLimitResult> {
        if (!isRedisConnected()) {
            // Allow if Redis is not available (fail open)
            return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 }
        }

        try {
            const redis = await getRedisClient()
            const redisKey = redisKeys.rateLimit(key)
            const now = Date.now()
            const windowStart = now - windowSeconds * 1000

            // Use a sorted set with timestamps as scores
            // Remove old entries outside the window
            await redis.zRemRangeByScore(redisKey, 0, windowStart)

            // Count current entries in window
            const count = await redis.zCard(redisKey)

            if (count >= maxRequests) {
                // Get the oldest entry to calculate reset time
                const oldest = await redis.zRange(redisKey, 0, 0, { BY: 'SCORE' })
                const resetAt = oldest.length > 0
                    ? parseInt(oldest[0]) + windowSeconds * 1000
                    : now + windowSeconds * 1000

                return {
                    allowed: false,
                    remaining: 0,
                    resetAt,
                }
            }

            // Add new entry
            await redis.zAdd(redisKey, { score: now, value: now.toString() })

            // Set TTL on the key
            await redis.expire(redisKey, windowSeconds)

            return {
                allowed: true,
                remaining: maxRequests - count - 1,
                resetAt: now + windowSeconds * 1000,
            }
        } catch (error) {
            logger.error('Rate limit check failed', error as Error, { key })
            // Fail open
            return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 }
        }
    },

    /**
     * Simple fixed window rate limiter (more efficient for high traffic)
     * @param key Unique identifier
     * @param maxRequests Maximum requests per window
     * @param windowSeconds Window duration
     */
    async checkFixed(
        key: string,
        maxRequests: number,
        windowSeconds: number
    ): Promise<RateLimitResult> {
        if (!isRedisConnected()) {
            return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 }
        }

        try {
            const redis = await getRedisClient()
            const redisKey = redisKeys.rateLimit(key)
            const now = Date.now()

            // Use INCR with TTL
            const count = await redis.incr(redisKey)

            // Set expiry only on first request
            if (count === 1) {
                await redis.expire(redisKey, windowSeconds)
            }

            const ttl = await redis.ttl(redisKey)
            const resetAt = now + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000)

            if (count > maxRequests) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetAt,
                }
            }

            return {
                allowed: true,
                remaining: maxRequests - count,
                resetAt,
            }
        } catch (error) {
            logger.error('Fixed rate limit check failed', error as Error, { key })
            return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 }
        }
    },

    /**
     * Reset rate limit for a key
     */
    async reset(key: string): Promise<boolean> {
        if (!isRedisConnected()) return false

        try {
            const redis = await getRedisClient()
            await redis.del(redisKeys.rateLimit(key))
            return true
        } catch (error) {
            logger.error('Failed to reset rate limit', error as Error, { key })
            return false
        }
    },

    /**
     * Get current count for a rate limit key
     */
    async getCount(key: string): Promise<number> {
        if (!isRedisConnected()) return 0

        try {
            const redis = await getRedisClient()
            const redisKey = redisKeys.rateLimit(key)
            const count = await redis.get(redisKey)
            return count ? parseInt(count) : 0
        } catch (error) {
            logger.error('Failed to get rate limit count', error as Error, { key })
            return 0
        }
    },
}
