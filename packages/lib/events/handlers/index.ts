/**
 * Central handler registration
 *
 * This file exports all handler registration functions and provides
 * a single entry point to register all handlers at once.
 */

import { loggers } from '@/packages/lib/logger'

import { eventConsumer } from '../consumer'
import { registerAccountHandlers } from './account'
import { registerAdminDiscordHandlers } from './admin-discord'
import { registerAdminHandlers } from './admin'
import { registerAuditHandlers } from './audit'
import { registerAuthHandlers } from './auth'
import { registerBillingHandlers } from './billing'
import { registerDiscordHandlers } from './discord'
import { registerEmailHandlers } from './email'
import { registerFileHandlers } from './file'
import { registerNexiumHandlers } from './nexium'
import { registerFileExpiryHandlers } from './file-expiry'
import { registerSecurityHandlers } from './security'
import { registerUserHandlers } from './user'

const logger = loggers.events.getChildLogger('handlers')

/**
 * Register all event handlers
 * 
 * Handler registration is now synchronous (in-memory only) for fast startup.
 * After all handlers are registered, we sync to Redis cache and DB in a single batch.
 */
export async function registerAllHandlers(): Promise<void> {
    const startTime = Date.now()
    logger.debug('Registering all event handlers...')

    // All these registration functions are now synchronous (in-memory only)
    registerAuditHandlers()
    registerEmailHandlers()
    registerAuthHandlers()
    registerAccountHandlers()
    registerFileHandlers()
    registerFileExpiryHandlers()
    registerBillingHandlers()
    registerSecurityHandlers()
    registerDiscordHandlers()
    registerAdminDiscordHandlers()
    registerAdminHandlers()
    registerUserHandlers()
    registerNexiumHandlers()

    const handlerCount = eventConsumer.getHandlerCount()
    const memoryDuration = Date.now() - startTime
    logger.debug(`${handlerCount} handlers registered in memory`, { duration: memoryDuration })

    // Sync to Redis and DB in background (non-blocking for faster startup)
    // We use fire-and-forget so startup doesn't wait for DB
    eventConsumer.syncHandlersToStorage()
        .then(() => {
            const totalDuration = Date.now() - startTime
            logger.info(`Event handlers synced to storage`, { handlerCount, totalDuration })
        })
        .catch((err) => {
            logger.warn('Failed to sync handlers to storage (handlers still work in-memory)', { error: err })
        })

    logger.info(`All ${handlerCount} event handlers registered`, { duration: memoryDuration, handlerCount })
}

// Re-export individual registration functions
export { registerAccountHandlers } from './account'
export { registerAdminDiscordHandlers } from './admin-discord'
export { registerAdminHandlers } from './admin'
export { registerAuditHandlers, getAuditLogsForUser, getRecentSecurityEvents } from './audit'
export { registerBillingHandlers } from './billing'
export { registerDiscordHandlers } from './discord'
export { registerEmailHandlers, setEmailService, EMAIL_TEMPLATES } from './email'
export { registerFileHandlers } from './file'
export { registerFileExpiryHandlers, scheduleFileExpiration, cancelFileExpiration, getFileExpirationInfo } from './file-expiry'
export { registerSecurityHandlers } from './security'
export { registerUserHandlers } from './user'
export { registerNexiumHandlers } from './nexium'
