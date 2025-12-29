import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'

import { events } from '../index'

const logger = loggers.events.getChildLogger('user-handler')

/**
 * Register user event handlers
 */
export function registerUserHandlers(): void {
    // ─────────────────────────────────────────────────────────────────────────────
    // Perk gained
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'user.perk-gained',
        'send-notification',
        async (payload: EventPayload<'user.perk-gained'>) => {
            logger.info('Perk gained', {
                userId: payload.userId,
                perkName: payload.perkName,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'perk-gained',
                subject: `🎉 You've unlocked: ${payload.perkName}`,
                variables: {
                    userName: undefined,
                    perkName: payload.perkName,
                    perkDescription: payload.perkDescription,
                    perkIcon: payload.perkIcon || '🎉',
                    expiresAt: payload.expiresAt?.toISOString(),
                },
                userId: payload.userId,
                priority: 'normal',
                sourceEvent: 'user.perk-gained',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Quota reached
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'user.quota-reached',
        'send-alert',
        async (payload: EventPayload<'user.quota-reached'>) => {
            logger.warn('Quota reached', {
                userId: payload.userId,
                quotaType: payload.quotaType,
                percentage: payload.percentage,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'quota-reached',
                subject: `⚠️ You've reached your ${payload.quotaType} quota`,
                variables: {
                    userName: undefined,
                    quotaType: payload.quotaType,
                    currentUsage: payload.currentUsage,
                    quotaLimit: payload.quotaLimit,
                    unit: payload.unit || 'GB',
                    percentage: payload.percentage,
                },
                userId: payload.userId,
                priority: 'high',
                sourceEvent: 'user.quota-reached',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Storage assigned
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'user.storage-assigned',
        'send-notification',
        async (payload: EventPayload<'user.storage-assigned'>) => {
            logger.info('Storage assigned', {
                userId: payload.userId,
                storageAmount: payload.storageAmount,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'storage-assigned',
                subject: `✨ You've been assigned ${payload.storageAmount} ${payload.unit || 'GB'} of storage`,
                variables: {
                    userName: undefined,
                    storageAmount: payload.storageAmount,
                    unit: payload.unit || 'GB',
                    totalStorage: payload.totalStorage,
                    reason: payload.reason,
                    expiresAt: payload.expiresAt?.toISOString(),
                },
                userId: payload.userId,
                priority: 'normal',
                sourceEvent: 'user.storage-assigned',
            })
        },
        { enabled: true, timeout: 15000 }
    )
}
