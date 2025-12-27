import type { EventPayload, EventType } from '@/packages/types/events'

import { sendTemplateEmail, BasicEmail, AdminBroadcastEmail } from '@/packages/lib/emails'
import { loggers } from '@/packages/lib/logger'

import { events } from '../index'
import { shouldSendEmail } from '../utils/email-preferences'

const logger = loggers.events.getChildLogger('email-handler')

/**
 * Send an email using the configured email service (Resend)
 */
async function sendEmail(options: {
    to: string
    subject: string
    template: string
    variables: Record<string, unknown>
}): Promise<{ messageId: string }> {
    const { to, subject, template, variables } = options

    // Use specific templates based on template name
    if (template === 'admin-broadcast') {
        const result = await sendTemplateEmail({
            to,
            subject,
            template: AdminBroadcastEmail,
            props: {
                subject,
                body: String(variables.body || ''),
                senderName: String(variables.senderName || 'Emberly Team'),
                priority: variables.priority as 'low' | 'normal' | 'high' | undefined,
                ctaLabel: typeof variables.ctaLabel === 'string' ? variables.ctaLabel : undefined,
                ctaHref: typeof variables.ctaHref === 'string' ? variables.ctaHref : undefined,
            },
            // Skip tracking since event system already tracks email.send -> email.sent
            skipTracking: true,
        })
        return { messageId: result.id || `email-${Date.now()}` }
    }

    // Default: use BasicEmail for other templates
    const bodyContent = typeof variables.body === 'string'
        ? variables.body.split('\n').filter(Boolean)
        : Array.isArray(variables.body)
            ? variables.body
            : [String(variables.body || 'No content')]

    const result = await sendTemplateEmail({
        to,
        subject,
        template: BasicEmail,
        props: {
            title: subject,
            preheader: typeof variables.preheader === 'string' ? variables.preheader : undefined,
            headline: typeof variables.headline === 'string' ? variables.headline : subject,
            body: bodyContent,
            cta: variables.ctaLabel && variables.ctaHref
                ? { label: String(variables.ctaLabel), href: String(variables.ctaHref) }
                : undefined,
            footerNote: typeof variables.footerNote === 'string' ? variables.footerNote : undefined,
        },
        // Skip tracking since event system already tracks email.send -> email.sent
        skipTracking: true,
    })

    return { messageId: result.id || `email-${Date.now()}` }
}

/**
 * Register email event handlers
 */
export function registerEmailHandlers(): void {
    // ─────────────────────────────────────────────────────────────────────────────
    // Send email handler
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'email.send',
        'send-email',
        async (payload: EventPayload<'email.send'>, event) => {
            // Check user preferences before sending (if sourceEvent provided)
            if (payload.sourceEvent && payload.userId) {
                const { shouldSend, reason } = await shouldSendEmail(
                    payload.userId,
                    payload.sourceEvent as EventType
                )

                if (!shouldSend) {
                    logger.info('Email skipped due to user preferences', {
                        to: payload.to,
                        template: payload.template,
                        reason,
                        sourceEvent: payload.sourceEvent,
                    })
                    return // Skip sending
                }
            }

            try {
                logger.debug('Sending email', {
                    to: payload.to,
                    template: payload.template,
                    subject: payload.subject,
                })

                const result = await sendEmail({
                    to: payload.to,
                    subject: payload.subject,
                    template: payload.template,
                    variables: payload.variables,
                })

                // Emit success event
                await events.emit('email.sent', {
                    to: payload.to,
                    template: payload.template,
                    messageId: result.messageId,
                    userId: payload.userId,
                })

                logger.info('Email sent successfully', {
                    to: payload.to,
                    template: payload.template,
                    messageId: result.messageId,
                })
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'

                logger.error('Failed to send email', error as Error, {
                    to: payload.to,
                    template: payload.template,
                })

                // Emit failure event
                await events.emit('email.failed', {
                    to: payload.to,
                    template: payload.template,
                    error: errorMessage,
                    userId: payload.userId,
                    willRetry: event.retryCount < event.maxRetries,
                })

                // Re-throw to trigger retry if configured
                throw error
            }
        },
        {
            enabled: true,
            maxConcurrency: 5,
            timeout: 30000,
            retryDelay: 5000,
        }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Email sent logging
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'email.sent',
        'log-sent',
        async (payload: EventPayload<'email.sent'>) => {
            logger.debug('Email sent event logged', {
                to: payload.to,
                template: payload.template,
                messageId: payload.messageId,
            })
            // Could store in email_logs table for tracking
        },
        { enabled: true, timeout: 5000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Email failure logging
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'email.failed',
        'log-failure',
        async (payload: EventPayload<'email.failed'>) => {
            logger.warn('Email failed', {
                to: payload.to,
                template: payload.template,
                error: payload.error,
                willRetry: payload.willRetry,
            })
            // Could store in email_logs table for debugging
        },
        { enabled: true, timeout: 5000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Email bounce handling
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'email.bounced',
        'handle-bounce',
        async (payload: EventPayload<'email.bounced'>) => {
            logger.warn('Email bounced', {
                to: payload.to,
                bounceType: payload.bounceType,
                messageId: payload.messageId,
            })

            // Hard bounces should suppress future sends
            if (payload.bounceType === 'hard') {
                logger.error('Hard bounce - should suppress email', { to: payload.to })
                // TODO: Add to suppression list in database
            }
        },
        { enabled: true, timeout: 10000 }
    )

    logger.debug('Email event handlers registered')
}

/**
 * Email templates that should be implemented
 */
export const EMAIL_TEMPLATES = {
    // Auth
    'new-device-login': 'New device login alert',
    'password-changed': 'Password change confirmation',
    'password-reset': 'Password reset link',
    '2fa-enabled': '2FA enabled confirmation',
    '2fa-disabled': '2FA disabled alert',
    'backup-codes-generated': 'Backup codes generated',
    'backup-code-used': 'Backup code used alert',
    'session-revoked': 'Session revoked notification',

    // Account
    'welcome': 'Welcome email',
    'verify-email': 'Email verification',
    'email-changed-old': 'Email changed (to old address)',
    'email-changed-new': 'Email changed (to new address)',
    'export-requested': 'Data export started',
    'export-completed': 'Data export ready',
    'deletion-requested': 'Account deletion scheduled',
    'deletion-cancelled': 'Account deletion cancelled',
    'account-deleted': 'Account deleted confirmation',

    // Billing
    'subscription-created': 'Subscription confirmation',
    'subscription-updated': 'Subscription change confirmation',
    'subscription-cancelled': 'Subscription cancellation',
    'payment-succeeded': 'Payment receipt',
    'payment-failed': 'Payment failed alert',
    'refund-issued': 'Refund confirmation',
} as const
