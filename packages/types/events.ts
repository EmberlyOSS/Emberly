export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SCHEDULED = 'SCHEDULED',
}

export interface BaseEvent {
  id: string
  type: string
  payload: Record<string, any>
  status: EventStatus
  priority: number
  scheduledAt?: Date
  createdAt: Date
  updatedAt: Date
  processedAt?: Date
  failedAt?: Date
  retryCount: number
  maxRetries: number
  error?: string
  metadata?: Record<string, any>
}

export interface EventEmissionOptions {
  priority?: number
  scheduledAt?: Date
  maxRetries?: number
  metadata?: Record<string, any>
}

export interface EventHandlerFunction<T = any> {
  (payload: T, event: BaseEvent): Promise<void> | void
}

export interface EventHandlerOptions {
  enabled?: boolean
  maxConcurrency?: number
  retryDelay?: number
  timeout?: number
}

export interface EventHandlerRegistration {
  id: string
  eventType: string
  handler: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EventProcessingResult {
  success: boolean
  error?: string
  shouldRetry?: boolean
  retryAfter?: number
}

export interface EventWorkerOptions {
  batchSize?: number
  pollInterval?: number
  maxConcurrency?: number
  enableScheduledEvents?: boolean
}

export interface EventStats {
  pending: number
  processing: number
  completed: number
  failed: number
  scheduled: number
}

export interface EventFilter {
  type?: string
  status?: EventStatus
  priority?: number
  scheduledBefore?: Date
  scheduledAfter?: Date
  createdBefore?: Date
  createdAfter?: Date
  excludeAuditable?: boolean // If true, excludes events marked as auditable
  limit?: number
  offset?: number
}

export enum ExpiryAction {
  DELETE = 'DELETE',
  SET_PRIVATE = 'SET_PRIVATE',
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared payload fragments
// ─────────────────────────────────────────────────────────────────────────────

export interface RequestContext {
  ip?: string
  userAgent?: string
  requestId?: string
  geo?: {
    country?: string
    region?: string
    city?: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Type Map
// ─────────────────────────────────────────────────────────────────────────────

export type EventTypeMap = {
  // ═══════════════════════════════════════════════════════════════════════════
  // FILE EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'file.uploaded': {
    fileId: string
    userId: string
    fileName: string
    fileSize: number
    mimeType: string
    visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
    context?: RequestContext
  }

  'file.downloaded': {
    fileId: string
    userId: string
    fileName: string
    downloadedBy?: string // userId if authenticated
    context?: RequestContext
  }

  'file.deleted': {
    fileId: string
    userId: string
    fileName: string
    fileSize: number
    deletedBy: string
    context?: RequestContext
  }

  'file.visibility-changed': {
    fileId: string
    userId: string
    fileName: string
    oldVisibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
    newVisibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
    context?: RequestContext
  }

  'file.schedule-expiration': {
    fileId: string
    userId: string
    fileName: string
    expiresAt: Date
    action: ExpiryAction
  }

  'file.expired': {
    fileId: string
    userId: string
    fileName: string
    filePath: string
    size: number
    action: ExpiryAction
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'auth.login': {
    userId: string
    email: string
    method: 'credentials' | 'oauth' | 'magic-link'
    provider?: string // 'google', 'github', etc.
    success: boolean
    failureReason?: string
    isNewDevice?: boolean
    context?: RequestContext
  }

  'auth.logout': {
    userId: string
    email: string
    allSessions?: boolean
    context?: RequestContext
  }

  'auth.password-changed': {
    userId: string
    email: string
    changedBy: 'user' | 'admin' | 'reset'
    context?: RequestContext
  }

  'auth.password-reset-requested': {
    userId: string
    email: string
    token?: string // hashed/partial for logging
    expiresAt: Date
    context?: RequestContext
  }

  'auth.password-reset-completed': {
    userId: string
    email: string
    context?: RequestContext
  }

  'auth.2fa-enabled': {
    userId: string
    email: string
    method: 'totp' | 'sms' | 'webauthn'
    context?: RequestContext
  }

  'auth.2fa-disabled': {
    userId: string
    email: string
    method: 'totp' | 'sms' | 'webauthn'
    disabledBy: 'user' | 'admin'
    context?: RequestContext
  }

  'auth.2fa-backup-codes-generated': {
    userId: string
    email: string
    codesCount: number
    context?: RequestContext
  }

  'auth.2fa-backup-code-used': {
    userId: string
    email: string
    codesRemaining: number
    context?: RequestContext
  }

  'auth.session-revoked': {
    userId: string
    email: string
    sessionId: string
    revokedBy: 'user' | 'admin' | 'system'
    reason?: string
    context?: RequestContext
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCOUNT EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'account.created': {
    userId: string
    email: string
    method: 'signup' | 'oauth' | 'invite' | 'admin'
    provider?: string
    context?: RequestContext
  }

  'account.email-changed': {
    userId: string
    oldEmail: string
    newEmail: string
    changedBy: 'user' | 'admin'
    context?: RequestContext
  }

  'account.email-verification-requested': {
    userId: string
    email: string
    token?: string // hashed/partial
    expiresAt: Date
    context?: RequestContext
  }

  'account.email-verified': {
    userId: string
    email: string
    context?: RequestContext
  }

  'account.profile-updated': {
    userId: string
    email: string
    fields: string[] // which fields changed
    context?: RequestContext
  }

  'account.export-requested': {
    userId: string
    email: string
    exportId: string
    context?: RequestContext
  }

  'account.export-completed': {
    userId: string
    email: string
    exportId: string
    downloadUrl?: string
    expiresAt?: Date
  }

  'account.deletion-requested': {
    userId: string
    email: string
    scheduledAt: Date
    context?: RequestContext
  }

  'account.deletion-cancelled': {
    userId: string
    email: string
    context?: RequestContext
  }

  'account.deleted': {
    userId: string
    email: string
    deletedBy: 'user' | 'admin' | 'system'
    reason?: string
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERK / QUOTA / FEATURE EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'user.perk-gained': {
    userId: string
    email: string
    perkName: string
    perkDescription?: string
    perkIcon?: string
    expiresAt?: Date
    context?: RequestContext
  }

  'user.quota-reached': {
    userId: string
    email: string
    quotaType: string
    currentUsage: number
    quotaLimit: number
    unit?: string
    percentage: number
    context?: RequestContext
  }

  'user.storage-assigned': {
    userId: string
    email: string
    storageAmount: number
    unit?: string
    totalStorage?: number
    reason?: string
    expiresAt?: Date
    context?: RequestContext
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL / NOTIFICATION EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'email.send': {
    to: string
    template: string
    subject: string
    variables: Record<string, unknown>
    userId?: string
    priority?: 'high' | 'normal' | 'low'
    sourceEvent?: string // The event that triggered this email (for preference checking)
  }

  'email.sent': {
    to: string
    template: string
    messageId?: string
    userId?: string
  }

  'email.failed': {
    to: string
    template: string
    error: string
    userId?: string
    willRetry: boolean
  }

  'email.bounced': {
    to: string
    messageId?: string
    bounceType: 'hard' | 'soft'
    userId?: string
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BILLING EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'billing.subscription-created': {
    userId: string
    email: string
    subscriptionId: string
    planId: string
    planName: string
    interval: 'month' | 'year'
    amount: number
    currency: string
  }

  'billing.subscription-updated': {
    userId: string
    email: string
    subscriptionId: string
    oldPlanId?: string
    newPlanId: string
    newPlanName: string
    changeType: 'upgrade' | 'downgrade' | 'interval-change'
  }

  'billing.subscription-cancelled': {
    userId: string
    email: string
    subscriptionId: string
    planId: string
    cancelledBy: 'user' | 'admin' | 'system'
    reason?: string
    effectiveAt: Date
  }

  'billing.payment-succeeded': {
    userId: string
    email: string
    paymentId: string
    amount: number
    currency: string
    invoiceId?: string
    receiptUrl?: string
  }

  'billing.payment-failed': {
    userId: string
    email: string
    paymentId?: string
    amount: number
    currency: string
    failureReason: string
    nextRetryAt?: Date
  }

  'billing.refund-issued': {
    userId: string
    email: string
    refundId: string
    paymentId: string
    amount: number
    currency: string
    reason?: string
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY / AUDIT EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'security.suspicious-activity': {
    userId?: string
    email?: string
    activityType: string
    details: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    context?: RequestContext
  }

  'security.rate-limit-exceeded': {
    userId?: string
    email?: string
    endpoint: string
    limit: number
    window: string
    context?: RequestContext
  }

  'security.api-key-created': {
    userId: string
    email: string
    keyId: string
    keyName: string
    scopes: string[]
    expiresAt?: Date
    context?: RequestContext
  }

  'security.api-key-revoked': {
    userId: string
    email: string
    keyId: string
    keyName: string
    revokedBy: 'user' | 'admin' | 'system'
    reason?: string
    context?: RequestContext
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'admin.user-role-changed': {
    targetUserId: string
    targetEmail: string
    adminUserId: string
    oldRole: string
    newRole: string
    context?: RequestContext
  }

  'admin.user-suspended': {
    targetUserId: string
    targetEmail: string
    adminUserId: string
    reason: string
    duration?: number // minutes, undefined = permanent
    context?: RequestContext
  }

  'admin.user-unsuspended': {
    targetUserId: string
    targetEmail: string
    adminUserId: string
    context?: RequestContext
  }

  'admin.content-removed': {
    contentType: 'file' | 'comment' | 'post'
    contentId: string
    ownerId: string
    adminUserId: string
    reason: string
    context?: RequestContext
  }

  'admin.broadcast-sent': {
    adminId: string
    recipientCount: number
    subject: string
    priority: string
    failedCount: number
    context?: RequestContext
  }

  'admin.user-banned': {
    adminId: string
    adminName: string
    targetId: string
    targetName: string
    targetEmail: string
    banType: 'temporary' | 'permanent'
    reason: string
    expiresAt?: Date
  }

  'admin.user-unbanned': {
    adminId: string
    adminName: string
    targetId: string
    targetName: string
    targetEmail: string
    reason?: string
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODERATION EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'moderation.user-reported': {
    reportId: string
    reportedUserId: string
    reportedUserName: string
    reporterUserId: string
    reporterUserName: string
    category: string
    reason: string
  }

  'moderation.report-resolved': {
    reportId: string
    reportedUserId: string
    adminId: string
    adminName: string
    resolution: string
    action: 'banned' | 'dismissed' | 'warned'
  }

  'moderation.squad-reported': {
    reportId: string
    squadId: string
    squadName: string
    reporterUserId: string
    reporterUserName: string
    category: string
    reason: string
  }

  'moderation.squad-report-resolved': {
    reportId: string
    squadId: string
    squadName: string
    adminId: string
    adminName: string
    resolution: string
    action: 'disbanded' | 'dismissed' | 'warned'
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPLICATION EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'application.submitted': {
    applicationId: string
    userId: string
    userName: string
    userEmail: string
    type: 'STAFF' | 'PARTNER' | 'VERIFICATION' | 'BAN_APPEAL'
  }

  'application.reviewed': {
    applicationId: string
    userId: string
    userName: string
    userEmail: string
    type: 'STAFF' | 'PARTNER' | 'VERIFICATION' | 'BAN_APPEAL'
    status: 'APPROVED' | 'REJECTED'
    reviewerName: string
    reviewNotes?: string
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTIMONIAL EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'testimonial.submitted': {
    testimonialId: string
    userId: string
    userName: string
    userEmail: string
    contentPreview: string
  }

  'testimonial.edited': {
    testimonialId: string
    userId: string
    userName: string
    userEmail: string
    contentPreview: string
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'system.client-error': {
    url: string
    message: string
    stack?: string
    userId?: string
    userAgent?: string
  }

  'system.server-error': {
    url: string
    message: string
    stack?: string
    userId?: string
    statusCode?: number
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEXIUM EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  'nexium.profile-created': {
    userId: string
    email: string
    profileId: string
    context?: RequestContext
  }

  'nexium.profile-updated': {
    userId: string
    email: string
    fields: string[]
    context?: RequestContext
  }

  'nexium.profile-deleted': {
    userId: string
    email: string
    context?: RequestContext
  }

  'nexium.skill-added': {
    userId: string
    email: string
    skillName: string
    context?: RequestContext
  }

  'nexium.skills-replaced': {
    userId: string
    email: string
    count: number
    context?: RequestContext
  }

  'nexium.signal-added': {
    userId: string
    email: string
    signalType: string
    signalTitle: string
    context?: RequestContext
  }

  'nexium.opportunity-created': {
    userId: string
    email: string
    opportunityId: string
    title: string
    context?: RequestContext
  }

  'nexium.squad-created': {
    userId: string
    email: string
    squadId: string
    squadName: string
    context?: RequestContext
  }

  'nexium.squad-invite': {
    userId: string
    email: string
    name?: string
    squadId: string
    squadName: string
    inviterName: string
    inviteUrl: string
    declineUrl: string
    context?: RequestContext
  }

  'nexium.squad-invite-accepted': {
    /** The squad owner's user id */
    ownerId: string
    ownerEmail: string
    ownerName?: string
    memberName: string
    squadId: string
    squadName: string
    squadUrl: string
    context?: RequestContext
  }

  'nexium.squad-invite-declined': {
    /** The squad owner's user id */
    ownerId: string
    ownerEmail: string
    ownerName?: string
    memberName: string
    squadId: string
    squadName: string
    context?: RequestContext
  }

  'nexium.opportunity-match': {
    userId: string
    email: string
    name?: string
    opportunityId: string
    opportunityTitle: string
    opportunityUrl: string
    companyName?: string
    matchedSkills: string[]
    context?: RequestContext
  }

  'nexium.application-received': {
    userId: string
    email: string
    applicantName: string
    applicationId: string
    opportunityId: string
    opportunityTitle: string
    reviewUrl: string
    context?: RequestContext
  }

  'nexium.application-accepted': {
    userId: string
    email: string
    name?: string
    applicationId: string
    opportunityId: string
    opportunityTitle: string
    squadName?: string
    profileUrl: string
    context?: RequestContext
  }

  'nexium.application-rejected': {
    userId: string
    email: string
    name?: string
    applicationId: string
    opportunityId: string
    opportunityTitle: string
    context?: RequestContext
  }
}

export type EventType = keyof EventTypeMap
export type EventPayload<T extends EventType> = EventTypeMap[T]

// ─────────────────────────────────────────────────────────────────────────────
// Event categories for filtering/grouping
// ─────────────────────────────────────────────────────────────────────────────

export const EventCategories = {
  file: ['file.uploaded', 'file.downloaded', 'file.deleted', 'file.visibility-changed', 'file.schedule-expiration', 'file.expired'],
  auth: ['auth.login', 'auth.logout', 'auth.password-changed', 'auth.password-reset-requested', 'auth.password-reset-completed', 'auth.2fa-enabled', 'auth.2fa-disabled', 'auth.2fa-backup-codes-generated', 'auth.2fa-backup-code-used', 'auth.session-revoked'],
  account: ['account.created', 'account.email-changed', 'account.email-verification-requested', 'account.email-verified', 'account.profile-updated', 'account.export-requested', 'account.export-completed', 'account.deletion-requested', 'account.deletion-cancelled', 'account.deleted'],
  user: ['user.perk-gained', 'user.quota-reached', 'user.storage-assigned'],
  email: ['email.send', 'email.sent', 'email.failed', 'email.bounced'],
  billing: ['billing.subscription-created', 'billing.subscription-updated', 'billing.subscription-cancelled', 'billing.payment-succeeded', 'billing.payment-failed', 'billing.refund-issued'],
  security: ['security.suspicious-activity', 'security.rate-limit-exceeded', 'security.api-key-created', 'security.api-key-revoked'],
  admin: ['admin.user-role-changed', 'admin.user-suspended', 'admin.user-unsuspended', 'admin.content-removed', 'admin.broadcast-sent', 'admin.user-banned', 'admin.user-unbanned'],
  moderation: ['moderation.user-reported', 'moderation.report-resolved', 'moderation.squad-reported', 'moderation.squad-report-resolved'],
  applications: ['application.submitted', 'application.reviewed'],
  testimonials: ['testimonial.submitted', 'testimonial.edited'],
  system: ['system.client-error', 'system.server-error'],
  nexium: ['nexium.profile-created', 'nexium.profile-updated', 'nexium.profile-deleted', 'nexium.skill-added', 'nexium.skills-replaced', 'nexium.signal-added', 'nexium.opportunity-created', 'nexium.squad-created', 'nexium.squad-invite', 'nexium.squad-invite-accepted', 'nexium.squad-invite-declined', 'nexium.opportunity-match', 'nexium.application-received', 'nexium.application-accepted', 'nexium.application-rejected'],
} as const

export type EventCategory = keyof typeof EventCategories
