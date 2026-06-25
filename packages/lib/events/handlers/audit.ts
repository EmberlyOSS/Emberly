import type { EventType, RequestContext } from '@/packages/types/events'
import type { Prisma } from '@/prisma/generated/prisma/client'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import type { HandlerFn, HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('audit')

export const AUDITABLE_EVENTS: EventType[] = [
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
  'account.created',
  'account.email-changed',
  'account.email-verified',
  'account.profile-updated',
  'account.export-requested',
  'account.export-completed',
  'account.deletion-requested',
  'account.deletion-cancelled',
  'account.deleted',
  'security.suspicious-activity',
  'security.rate-limit-exceeded',
  'security.api-key-created',
  'security.api-key-revoked',
  'admin.user-role-changed',
  'admin.user-suspended',
  'admin.user-unsuspended',
  'admin.content-removed',
  'billing.subscription-created',
  'billing.subscription-updated',
  'billing.subscription-cancelled',
  'billing.payment-succeeded',
  'billing.payment-failed',
  'billing.refund-issued',
  'nexium.profile-created',
  'nexium.profile-updated',
  'nexium.profile-deleted',
  'nexium.skill-added',
  'nexium.skills-replaced',
  'nexium.signal-added',
  'nexium.opportunity-created',
  'nexium.squad-created',
]

export function isAuditableEvent(eventType: EventType): boolean {
  return AUDITABLE_EVENTS.includes(eventType)
}

function extractAuditFields(
  eventType: EventType,
  payload: Record<string, unknown>
): {
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

  let actorId = payload.userId as string | undefined
  const actorEmail = payload.email as string | undefined
  let targetId: string | undefined
  let targetEmail: string | undefined

  if (eventType.startsWith('admin.')) {
    actorId = payload.adminUserId as string | undefined
    targetId = payload.targetUserId as string | undefined
    targetEmail = payload.targetEmail as string | undefined
  }

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

function redactSensitiveData(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'credential',
    'authorization',
  ]
  const redacted = { ...payload }

  for (const key of Object.keys(redacted)) {
    if (sensitiveFields.some((f) => key.toLowerCase().includes(f))) {
      redacted[key] = '[REDACTED]'
    }
  }

  for (const key of Object.keys(redacted)) {
    const value = redacted[key]
    if (typeof value === 'string' && value.length > 500) {
      redacted[key] = value.substring(0, 500) + '...[truncated]'
    }
  }

  return redacted
}

async function writeAuditRecord(
  type: EventType,
  payload: Record<string, unknown>
): Promise<void> {
  const auditFields = extractAuditFields(type, payload)
  const redactedPayload = redactSensitiveData(payload)

  try {
    await prisma.event.create({
      data: {
        type,
        payload: redactedPayload as Prisma.InputJsonValue,
        status: 'COMPLETED',
        priority: 0,
        maxRetries: 0,
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
      },
    })
    logger.debug('Audit record written', { type })
  } catch (error) {
    logger.error('Failed to write audit record', error as Error, { type })
    throw error
  }
}

const auditHandler: HandlerFn = async (payload, job) => {
  await writeAuditRecord(
    job.name as EventType,
    payload as Record<string, unknown>
  )
}

export const auditHandlerMap: HandlerMap = Object.fromEntries(
  AUDITABLE_EVENTS.map((type) => [type, [auditHandler]])
) as HandlerMap

export { auditHandler }

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
    OR: [{ actorId: userId }, { targetId: userId }],
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
      OR: [{ actorId: userId }, { targetId: userId }],
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
