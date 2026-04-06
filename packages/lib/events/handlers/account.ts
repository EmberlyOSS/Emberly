import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'

import { events } from '../index'

const logger = loggers.events.getChildLogger('account-handler')

/**
 * Register account event handlers
 */
export function registerAccountHandlers(): void {
    // ─────────────────────────────────────────────────────────────────────────────
    // Account creation
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'account.created',
        'send-welcome',
        async (payload: EventPayload<'account.created'>) => {
            logger.info('Account created', {
                userId: payload.userId,
                method: payload.method,
            })
        },
        { enabled: true, timeout: 15000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Email verification
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'account.email-verification-requested',
        'send-verification',
        async (payload: EventPayload<'account.email-verification-requested'>) => {
            logger.info('Email verification requested', { userId: payload.userId })

            await events.emit('email.send', {
                to: payload.email,
                template: 'verify-email',
                subject: 'Verify your Emberly email address - testing',
                variables: {
                    email: payload.email,
                    verifyToken: payload.token,
                    expiresAt: payload.expiresAt.toISOString(),
                },
                userId: payload.userId,
                priority: 'high',
                sourceEvent: 'account.email-verification-requested',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    events.on(
        'account.email-verified',
        'log-verification',
        async (payload: EventPayload<'account.email-verified'>) => {
            logger.info('Email verified', {
                userId: payload.userId,
                email: payload.email,
            })
        },
        { enabled: true, timeout: 5000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Email change
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'account.email-changed',
        'send-notifications',
        async (payload: EventPayload<'account.email-changed'>) => {
            logger.info('Email changed', {
                userId: payload.userId,
                oldEmail: payload.oldEmail,
                newEmail: payload.newEmail,
            })

            // Notify old email
            await events.emit('email.send', {
                to: payload.oldEmail,
                template: 'email-changed-old',
                subject: 'Your Emberly email address was changed',
                variables: {
                    oldEmail: payload.oldEmail,
                    newEmail: payload.newEmail,
                    changedAt: new Date().toISOString(),
                    changedBy: payload.changedBy,
                },
                userId: payload.userId,
                priority: 'high',
                sourceEvent: 'account.email-changed',
            })

            // Notify new email
            await events.emit('email.send', {
                to: payload.newEmail,
                template: 'email-changed-new',
                subject: 'Welcome to your new Emberly email',
                variables: {
                    oldEmail: payload.oldEmail,
                    newEmail: payload.newEmail,
                    changedAt: new Date().toISOString(),
                },
                userId: payload.userId,
                priority: 'high',
                sourceEvent: 'account.email-changed',
            })
        },
        { enabled: true, timeout: 30000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Data export
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'account.export-requested',
        'log-export',
        async (payload: EventPayload<'account.export-requested'>) => {
            logger.info('Data export requested', {
                userId: payload.userId,
                exportId: payload.exportId,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'export-requested',
                subject: 'Your Emberly data export is being prepared',
                variables: {
                    email: payload.email,
                    exportId: payload.exportId,
                    requestedAt: new Date().toISOString(),
                },
                userId: payload.userId,
                priority: 'normal',
                sourceEvent: 'account.export-requested',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    events.on(
        'account.export-completed',
        'send-download-link',
        async (payload: EventPayload<'account.export-completed'>) => {
            logger.info('Data export completed', {
                userId: payload.userId,
                exportId: payload.exportId,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'export-completed',
                subject: 'Your Emberly data export is ready',
                variables: {
                    email: payload.email,
                    exportId: payload.exportId,
                    downloadUrl: payload.downloadUrl,
                    expiresAt: payload.expiresAt?.toISOString(),
                },
                userId: payload.userId,
                priority: 'high',
                sourceEvent: 'account.export-completed',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Account deletion
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'account.deletion-requested',
        'send-confirmation',
        async (payload: EventPayload<'account.deletion-requested'>) => {
            logger.warn('Account deletion requested', {
                userId: payload.userId,
                scheduledAt: payload.scheduledAt,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'deletion-requested',
                subject: 'Your Emberly account is scheduled for deletion',
                variables: {
                    email: payload.email,
                    scheduledAt: payload.scheduledAt.toISOString(),
                    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?cancel-deletion=true`,
                },
                userId: payload.userId,
                priority: 'high',
                sourceEvent: 'account.deletion-requested',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    events.on(
        'account.deletion-cancelled',
        'send-confirmation',
        async (payload: EventPayload<'account.deletion-cancelled'>) => {
            logger.info('Account deletion cancelled', { userId: payload.userId })

            await events.emit('email.send', {
                to: payload.email,
                template: 'deletion-cancelled',
                subject: 'Your Emberly account deletion was cancelled',
                variables: {
                    email: payload.email,
                    cancelledAt: new Date().toISOString(),
                },
                userId: payload.userId,
                priority: 'normal',
                sourceEvent: 'account.deletion-cancelled',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    events.on(
        'account.deleted',
        'send-goodbye',
        async (payload: EventPayload<'account.deleted'>) => {
            logger.info('Account deleted', {
                userId: payload.userId,
                deletedBy: payload.deletedBy,
            })

            // Send goodbye email (best effort, account is gone)
            await events.emit('email.send', {
                to: payload.email,
                template: 'account-deleted',
                body: [`We're sorry to see you go. Your Emberly account associated with ${payload.email} has been deleted.`],
                subject: 'Your Emberly account has been deleted',
                variables: {
                    email: payload.email,
                    deletedAt: new Date().toISOString(),
                    reason: payload.reason,
                },
                priority: 'normal',
                sourceEvent: 'account.deleted',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    logger.debug('Account event handlers registered')
}
