/**
 * Audit Event Helper
 *
 * Convenience functions for routes to emit standard audit events.
 * All payload shapes match the EventTypeMap in packages/types/events.ts exactly.
 */

import type { EventPayload, EventType } from '@/packages/types/events'

import { events } from './index'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.events.getChildLogger('audit-helper')

/**
 * Fire-and-forget audit event emission.
 * Errors are logged but never thrown, so audit events never break the main operation.
 */
export async function emitAuditEvent<T extends EventType>(
  eventType: T,
  payload: EventPayload<T>
): Promise<void> {
  try {
    await events.emit(eventType, payload)
    logger.debug(`Audit event emitted: ${eventType}`)
  } catch (error) {
    logger.error(`Failed to emit audit event: ${eventType}`, error as Error)
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Route-Specific Audit Helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Emit admin.user-role-changed event.
 * All field names match EventTypeMap exactly.
 */
export function auditRoleChange(
  adminUserId: string,
  targetUserId: string,
  targetEmail: string,
  oldRole: string,
  newRole: string
): void {
  emitAuditEvent('admin.user-role-changed', {
    adminUserId,
    targetUserId,
    targetEmail,
    oldRole,
    newRole,
  }).catch((err) => logger.error('Failed to emit role-changed event', err))
}

/**
 * Emit admin.user-suspended event.
 */
export function auditSuspension(
  adminUserId: string,
  targetUserId: string,
  targetEmail: string,
  reason: string,
  duration?: number
): void {
  emitAuditEvent('admin.user-suspended', {
    adminUserId,
    targetUserId,
    targetEmail,
    reason,
    duration,
  }).catch((err) => logger.error('Failed to emit user-suspended event', err))
}

/**
 * Emit admin.content-removed event.
 */
export function auditContentRemoval(
  adminUserId: string,
  contentType: 'file' | 'comment' | 'post',
  contentId: string,
  ownerId: string,
  reason: string
): void {
  emitAuditEvent('admin.content-removed', {
    adminUserId,
    contentType,
    contentId,
    ownerId,
    reason,
  }).catch((err) => logger.error('Failed to emit content-removed event', err))
}

/**
 * Emit security.suspicious-activity event.
 */
export function auditSuspiciousActivity(
  activityType: string,
  details: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  opts?: { userId?: string; email?: string }
): void {
  emitAuditEvent('security.suspicious-activity', {
    activityType,
    details,
    severity,
    userId: opts?.userId,
    email: opts?.email,
  }).catch((err) => logger.error('Failed to emit suspicious-activity event', err))
}

/**
 * Emit billing.payment-failed event.
 */
export function auditPaymentFailed(
  userId: string,
  email: string,
  amount: number,
  currency: string,
  failureReason: string,
  paymentId?: string
): void {
  emitAuditEvent('billing.payment-failed', {
    userId,
    email,
    amount,
    currency,
    failureReason,
    paymentId,
  }).catch((err) => logger.error('Failed to emit payment-failed event', err))
}

/**
 * Emit billing.refund-issued event.
 */
export function auditRefundIssued(
  userId: string,
  email: string,
  refundId: string,
  paymentId: string,
  amount: number,
  currency: string,
  reason?: string
): void {
  emitAuditEvent('billing.refund-issued', {
    userId,
    email,
    refundId,
    paymentId,
    amount,
    currency,
    reason,
  }).catch((err) => logger.error('Failed to emit refund-issued event', err))
}
