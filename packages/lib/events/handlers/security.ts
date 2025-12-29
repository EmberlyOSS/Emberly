import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'

import { events } from '../index'

const logger = loggers.events.getChildLogger('security-handler')

/**
 * Register security event handlers
 */
export function registerSecurityHandlers(): void {
    // ─────────────────────────────────────────────────────────────────────────────
    // Suspicious activity
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'security.suspicious-activity',
        'alert-user',
        async (payload: EventPayload<'security.suspicious-activity'>) => {
            logger.warn('Suspicious activity detected', {
                userId: payload.userId,
                activityType: payload.activityType,
                severity: payload.severity,
            })

            // Only email for medium+ severity if we have user email
            if (payload.email && ['medium', 'high', 'critical'].includes(payload.severity)) {
                await events.emit('email.send', {
                    to: payload.email,
                    template: 'suspicious-activity',
                    subject: '⚠️ Suspicious activity detected on your Emberly account',
                    variables: {
                        email: payload.email,
                        activityType: payload.activityType,
                        details: payload.details,
                        severity: payload.severity,
                        ip: payload.context?.ip || 'Unknown',
                        location: payload.context?.geo?.city
                            ? `${payload.context.geo.city}, ${payload.context.geo.country}`
                            : 'Unknown location',
                        detectedAt: new Date().toISOString(),
                    },
                    userId: payload.userId,
                    priority: 'high',
                    sourceEvent: 'security.suspicious-activity',
                })
            }

            // Critical severity should also alert admins
            if (payload.severity === 'critical') {
                logger.error('CRITICAL security event', {
                    userId: payload.userId,
                    activityType: payload.activityType,
                    details: payload.details,
                    context: payload.context,
                })
                // TODO: Send to admin notification channel (Discord, Slack, etc.)
            }
        },
        { enabled: true, timeout: 30000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Rate limiting
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'security.rate-limit-exceeded',
        'log-and-monitor',
        async (payload: EventPayload<'security.rate-limit-exceeded'>) => {
            logger.warn('Rate limit exceeded', {
                userId: payload.userId,
                endpoint: payload.endpoint,
                limit: payload.limit,
                window: payload.window,
                ip: payload.context?.ip,
            })

            // Could implement progressive blocking here
            // e.g., after N rate limit events, temporarily block the IP
        },
        { enabled: true, timeout: 5000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // API key events
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'security.api-key-created',
        'send-notification',
        async (payload: EventPayload<'security.api-key-created'>) => {
            logger.info('API key created', {
                userId: payload.userId,
                keyId: payload.keyId,
                keyName: payload.keyName,
                scopes: payload.scopes,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'api-key-created',
                subject: 'New API key created for your Emberly account',
                variables: {
                    email: payload.email,
                    keyName: payload.keyName,
                    scopes: payload.scopes.join(', '),
                    expiresAt: payload.expiresAt?.toISOString() || 'Never',
                    createdAt: new Date().toISOString(),
                    ip: payload.context?.ip || 'Unknown',
                },
                userId: payload.userId,
                priority: 'normal',
                sourceEvent: 'security.api-key-created',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    events.on(
        'security.api-key-revoked',
        'send-notification',
        async (payload: EventPayload<'security.api-key-revoked'>) => {
            logger.info('API key revoked', {
                userId: payload.userId,
                keyId: payload.keyId,
                revokedBy: payload.revokedBy,
            })

            // Only send email if revoked by admin or system (not self-revoke)
            if (payload.revokedBy !== 'user') {
                await events.emit('email.send', {
                    to: payload.email,
                    template: 'api-key-revoked',
                    subject: '⚠️ An API key was revoked on your Emberly account',
                    variables: {
                        email: payload.email,
                        keyName: payload.keyName,
                        revokedBy: payload.revokedBy,
                        reason: payload.reason || 'Security precaution',
                        revokedAt: new Date().toISOString(),
                    },
                    userId: payload.userId,
                    priority: 'high',
                    sourceEvent: 'security.api-key-revoked',
                })
            }
        },
        { enabled: true, timeout: 15000 }
    )

    logger.debug('Security event handlers registered')
}
