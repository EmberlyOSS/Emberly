import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'

import { events } from '../index'

const logger = loggers.events.getChildLogger('admin-handler')

/**
 * Register admin event handlers
 */
export function registerAdminHandlers(): void {
    // ─────────────────────────────────────────────────────────────────────────────
    // User role changed
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'admin.user-role-changed',
        'notify-user',
        async (payload: EventPayload<'admin.user-role-changed'>) => {
            logger.info('User role changed', {
                targetUserId: payload.targetUserId,
                adminUserId: payload.adminUserId,
                oldRole: payload.oldRole,
                newRole: payload.newRole,
            })

            await events.emit('email.send', {
                to: payload.targetEmail,
                template: 'role-changed',
                subject: 'Your Emberly account role has been updated',
                variables: {
                    email: payload.targetEmail,
                    oldRole: payload.oldRole,
                    newRole: payload.newRole,
                    changedAt: new Date().toISOString(),
                },
                userId: payload.targetUserId,
                priority: 'normal',
                sourceEvent: 'admin.user-role-changed',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // User suspended
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'admin.user-suspended',
        'notify-user',
        async (payload: EventPayload<'admin.user-suspended'>) => {
            logger.warn('User suspended', {
                targetUserId: payload.targetUserId,
                adminUserId: payload.adminUserId,
                reason: payload.reason,
                duration: payload.duration,
            })

            const isPermanent = !payload.duration
            const expiresAt = payload.duration
                ? new Date(Date.now() + payload.duration * 60 * 1000)
                : null

            await events.emit('email.send', {
                to: payload.targetEmail,
                template: 'account-suspended',
                subject: 'Your Emberly account has been suspended',
                variables: {
                    email: payload.targetEmail,
                    reason: payload.reason,
                    isPermanent,
                    expiresAt: expiresAt?.toISOString(),
                    suspendedAt: new Date().toISOString(),
                    appealUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contact`,
                },
                userId: payload.targetUserId,
                priority: 'high',
                sourceEvent: 'admin.user-suspended',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // User unsuspended
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'admin.user-unsuspended',
        'notify-user',
        async (payload: EventPayload<'admin.user-unsuspended'>) => {
            logger.info('User unsuspended', {
                targetUserId: payload.targetUserId,
                adminUserId: payload.adminUserId,
            })

            await events.emit('email.send', {
                to: payload.targetEmail,
                template: 'account-unsuspended',
                subject: 'Your Emberly account has been restored',
                variables: {
                    email: payload.targetEmail,
                    restoredAt: new Date().toISOString(),
                },
                userId: payload.targetUserId,
                priority: 'high',
                sourceEvent: 'admin.user-unsuspended',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Content removed
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'admin.content-removed',
        'log-removal',
        async (payload: EventPayload<'admin.content-removed'>) => {
            logger.warn('Content removed by admin', {
                contentType: payload.contentType,
                contentId: payload.contentId,
                ownerId: payload.ownerId,
                adminUserId: payload.adminUserId,
                reason: payload.reason,
            })

            // Could notify the content owner if we have their email
            // This is optional and depends on your policy
        },
        { enabled: true, timeout: 10000 }
    )

    logger.debug('Admin event handlers registered')
}
