import type { BaseEvent, EventType, RequestContext } from '@/packages/types/events'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

import { events } from '../index'

const logger = loggers.events.getChildLogger('audit')

/**
 * Events that should be marked as auditable and retained permanently.
 * These events will NOT be cleaned up by the worker's cleanup process.
 */
export const AUDITABLE_EVENTS: EventType[] = [
    // Auth events
    'auth.login',
    'auth.logout',
    'auth.password-changed',
    'auth.password-reset-requested',
    'auth.password-reset-completed',
    'auth.2fa-enabled',
    'auth.2fa-disabled',
    'auth.2fa-backup-codes-generated',
    'auth.2fa-backup-code-used',
    'auth.session-revoked',
    // Account events
    'account.created',
    'account.email-changed',
    'account.email-verified',
    'account.profile-updated',
    'account.export-requested',
    'account.export-completed',
    'account.deletion-requested',
    'account.deletion-cancelled',
    'account.deleted',
    // Security events
    'security.suspicious-activity',
    'security.rate-limit-exceeded',
    'security.api-key-created',
    'security.api-key-revoked',
    // Admin events
    'admin.user-role-changed',
    'admin.user-suspended',
    'admin.user-unsuspended',
    'admin.content-removed',
    // Billing events (high-value)
    'billing.subscription-created',
    'billing.subscription-updated',
    'billing.subscription-cancelled',
    'billing.payment-succeeded',
    'billing.payment-failed',
    'billing.refund-issued',
]

/**
 * Extracts common audit fields from event payload
 */
function extractAuditFields(eventType: EventType, payload: Record<string, unknown>): {
    actorId?: string
    actorEmail?: string
    targetId?: string
    targetEmail?: string
    action: string
    resource: string
    success: boolean
    ip?: string
    userAgent?: string
    geo?: Record<string, string>
} {
    const context = payload.context as RequestContext | undefined
    const [resource, action] = eventType.split('.')

    // Determine actor and target based on event type
    let actorId = payload.userId as string | undefined
    let actorEmail = payload.email as string | undefined
    let targetId: string | undefined
    let targetEmail: string | undefined

    // Admin actions have a different actor
    if (eventType.startsWith('admin.')) {
        actorId = payload.adminUserId as string | undefined
        targetId = payload.targetUserId as string | undefined
        targetEmail = payload.targetEmail as string | undefined
    }

    // Determine success (default true unless explicitly failed)
    let success = true
    if ('success' in payload) {
        success = payload.success as boolean
    }

    return {
        actorId,
        actorEmail,
        targetId,
        targetEmail,
        action,
        resource,
        success,
        ip: context?.ip,
        userAgent: context?.userAgent,
        geo: context?.geo as Record<string, string> | undefined,
    }
}

/**
 * Redacts sensitive fields from payload before storing for audit.
 * The redacted payload replaces the original in the Event record.
 */
function redactSensitiveData(payload: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential', 'authorization']
    const redacted = { ...payload }

    for (const key of Object.keys(redacted)) {
        const lowerKey = key.toLowerCase()
        if (sensitiveFields.some(f => lowerKey.includes(f))) {
            redacted[key] = '[REDACTED]'
        }
    }

    // Truncate large fields
    for (const key of Object.keys(redacted)) {
        const value = redacted[key]
        if (typeof value === 'string' && value.length > 500) {
            redacted[key] = value.substring(0, 500) + '...[truncated]'
        }
    }

    return redacted
}

/**
 * Marks an event as auditable by updating it with audit metadata.
 * Auditable events are excluded from cleanup and retained permanently.
 */
async function markEventAsAuditable(event: BaseEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>
    const auditFields = extractAuditFields(event.type as EventType, payload)
    const redactedPayload = redactSensitiveData(payload)

    try {
        await prisma.event.update({
            where: { id: event.id },
            data: {
                isAuditable: true,
                actorId: auditFields.actorId,
                actorEmail: auditFields.actorEmail,
                targetId: auditFields.targetId,
                targetEmail: auditFields.targetEmail,
                action: auditFields.action,
                resource: auditFields.resource,
                success: auditFields.success,
                ip: auditFields.ip,
                userAgent: auditFields.userAgent,
                geo: auditFields.geo,
                // Replace payload with redacted version for long-term storage
                payload: redactedPayload,
            },
        })

        logger.debug('Event marked as auditable', {
            eventId: event.id,
            eventType: event.type,
            actorId: auditFields.actorId,
        })
    } catch (error) {
        logger.error('Failed to mark event as auditable', error as Error, {
            eventId: event.id,
            eventType: event.type,
        })
        throw error
    }
}

/**
 * Register audit logging handlers for all auditable events.
 * These handlers mark events as auditable so they're retained permanently.
 */
export function registerAuditHandlers(): void {
    for (const eventType of AUDITABLE_EVENTS) {
        events.on(
            eventType,
            'audit-logger',
            async (_payload, event) => {
                await markEventAsAuditable(event)
            },
            {
                enabled: true,
                maxConcurrency: 10,
                timeout: 10000,
            }
        )
    }

    logger.debug('Audit handlers registered', { count: AUDITABLE_EVENTS.length })
}

/**
 * Query audit events for a user (as actor or target)
 */
export async function getAuditEventsForUser(
    userId: string,
    options: {
        limit?: number
        offset?: number
        eventTypes?: EventType[]
        startDate?: Date
        endDate?: Date
    } = {}
): Promise<unknown[]> {
    const { limit = 50, offset = 0, eventTypes, startDate, endDate } = options

    const where: Record<string, unknown> = {
        isAuditable: true,
        OR: [
            { actorId: userId },
            { targetId: userId },
        ],
    }

    if (eventTypes?.length) {
        where.type = { in: eventTypes }
    }

    if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) (where.createdAt as Record<string, Date>).gte = startDate
        if (endDate) (where.createdAt as Record<string, Date>).lte = endDate
    }

    return prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
            id: true,
            type: true,
            actorId: true,
            actorEmail: true,
            targetId: true,
            targetEmail: true,
            action: true,
            resource: true,
            success: true,
            ip: true,
            userAgent: true,
            geo: true,
            createdAt: true,
            metadata: true,
        },
    })
}

/**
 * Get recent security events for user's profile/security page
 */
export async function getRecentSecurityEvents(
    userId: string,
    limit = 10
): Promise<unknown[]> {
    const securityEventTypes: EventType[] = [
        'auth.login',
        'auth.logout',
        'auth.password-changed',
        'auth.2fa-enabled',
        'auth.2fa-disabled',
        'auth.session-revoked',
        'account.email-changed',
        'security.suspicious-activity',
    ]

    return prisma.event.findMany({
        where: {
            isAuditable: true,
            OR: [
                { actorId: userId },
                { targetId: userId },
            ],
            type: { in: securityEventTypes },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            type: true,
            action: true,
            success: true,
            ip: true,
            geo: true,
            createdAt: true,
        },
    })
}

/**
 * Check if an event type is auditable
 */
export function isAuditableEvent(eventType: EventType): boolean {
    return AUDITABLE_EVENTS.includes(eventType)
}
