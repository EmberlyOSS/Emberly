import { configCache } from '@/packages/lib/cache/config-cache'
import { loggers } from '@/packages/lib/logger'

import { prisma } from './prisma'

const logger = loggers.db

// In-memory cache for setup completion status (fallback when Redis unavailable)
// This avoids hitting the database on every request
interface SetupCache {
  isComplete: boolean | null
  checkedAt: number
}

const setupCache: SetupCache = {
  isComplete: null,
  checkedAt: 0,
}

// Cache TTL: 30 seconds in development, 5 minutes in production
const CACHE_TTL_MS =
  process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 30 * 1000

/**
 * Check if initial setup has been completed (at least one user exists).
 * Results are cached in Redis (preferred) or in-memory as fallback.
 * The cache is automatically invalidated after the TTL expires.
 */
export async function checkSetupCompletion(): Promise<boolean> {
  const now = Date.now()

  // Try Redis cache first
  const redisCached = await configCache.getSetupStatus()
  if (redisCached !== null) {
    logger.trace('Setup check (Redis cached)', { isSetup: redisCached })
    return redisCached
  }

  // Fall back to in-memory cache
  if (setupCache.isComplete !== null && now - setupCache.checkedAt < CACHE_TTL_MS) {
    logger.trace('Setup check (memory cached)', { isSetup: setupCache.isComplete })
    return setupCache.isComplete
  }

  try {
    const userCount = await prisma.user.count()
    const isComplete = userCount > 0

    // Update Redis cache
    await configCache.setSetupStatus(isComplete)

    // Update in-memory cache as fallback
    setupCache.isComplete = isComplete
    setupCache.checkedAt = now

    logger.trace('Setup check completed', { userCount, isSetup: isComplete })
    return isComplete
  } catch (error) {
    logger.error('Setup check failed', error as Error)
    return false
  }
}

/**
 * Invalidate the setup completion cache.
 * Call this after setup is completed to ensure the next check hits the database.
 */
export async function invalidateSetupCache(): Promise<void> {
  // Invalidate Redis cache
  await configCache.invalidateSetupStatus()

  // Invalidate in-memory cache
  setupCache.isComplete = null
  setupCache.checkedAt = 0
  logger.trace('Setup cache invalidated')
}
