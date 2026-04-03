/**
 * Admin Discord Notifications
 * 
 * Sends critical events to admin Discord webhook (DISCORD_WEBHOOK_URL)
 * Events: Admin actions, security issues, billing problems, system alerts
 */

import type { EventPayload } from '@/packages/types/events'
import { loggers } from '@/packages/lib/logger'
import { notifyDiscord } from '../utils/discord-webhook'
import { events } from '../index'

const logger = loggers.events.getChildLogger('admin-discord')

const ADMIN_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

// Color coding for admin alerts
const ALERT_COLORS = {
  critical: 0xff0000, // Red
  warning: 0xffa500, // Orange
  success: 0x00ff00, // Green
  info: 0x0099ff, // Blue
  security: 0xff1493, // Deep pink
}

/**
 * Send alert to admin Discord channel
 */
async function sendAdminAlert(embed: {
  title: string
  description?: string
  color: number
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  timestamp?: Date
}): Promise<void> {
  if (!ADMIN_WEBHOOK_URL) {
    logger.warn('DISCORD_WEBHOOK_URL not configured, skipping admin alert')
    return
  }

  try {
    await notifyDiscord({
      webhookUrl: ADMIN_WEBHOOK_URL,
      embeds: [{
        ...embed,
        timestamp: embed.timestamp?.toISOString(),
      }],
    })
    logger.info('Admin alert sent to Discord', { title: embed.title })
  } catch (error) {
    logger.error('Failed to send admin alert to Discord', error as Error)
  }
}

/**
 * Register admin Discord notification handlers for critical events
 */
export function registerAdminDiscordHandlers(): void {
  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  events.on(
    'admin.user-role-changed',
    'admin-discord-notify',
    async (payload: EventPayload<'admin.user-role-changed'>) => {
      await sendAdminAlert({
        title: '⚠️ User Role Changed',
        description: `User **${payload.targetEmail}** role changed`,
        color: ALERT_COLORS.warning,
        fields: [
          { name: 'Admin ID', value: payload.adminUserId, inline: true },
          { name: 'User', value: payload.targetEmail, inline: true },
          { name: 'Old Role', value: payload.oldRole, inline: true },
          { name: 'New Role', value: payload.newRole, inline: true },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'admin.user-suspended',
    'admin-discord-notify',
    async (payload: EventPayload<'admin.user-suspended'>) => {
      const duration = payload.duration ? `${payload.duration} minutes` : 'Permanent'
      await sendAdminAlert({
        title: '🚫 User Suspended',
        description: `**${payload.targetEmail}** has been suspended`,
        color: ALERT_COLORS.critical,
        fields: [
          { name: 'Admin ID', value: payload.adminUserId, inline: true },
          { name: 'User', value: payload.targetEmail, inline: true },
          { name: 'Duration', value: duration, inline: true },
          { name: 'Reason', value: payload.reason, inline: false },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'admin.user-unsuspended',
    'admin-discord-notify',
    async (payload: EventPayload<'admin.user-unsuspended'>) => {
      await sendAdminAlert({
        title: '✅ User Unsuspended',
        description: `**${payload.targetEmail}** has been unsuspended`,
        color: ALERT_COLORS.success,
        fields: [
          { name: 'Admin ID', value: payload.adminUserId, inline: true },
          { name: 'User', value: payload.targetEmail, inline: true },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'admin.content-removed',
    'admin-discord-notify',
    async (payload: EventPayload<'admin.content-removed'>) => {
      await sendAdminAlert({
        title: '🗑️ Content Removed',
        description: `A **${payload.contentType}** was removed`,
        color: ALERT_COLORS.warning,
        fields: [
          { name: 'Admin ID', value: payload.adminUserId, inline: true },
          { name: 'Owner ID', value: payload.ownerId, inline: true },
          { name: 'Content Type', value: payload.contentType, inline: true },
          { name: 'Content ID', value: payload.contentId, inline: true },
          { name: 'Reason', value: payload.reason, inline: false },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'admin.broadcast-sent',
    'admin-discord-notify',
    async (payload: EventPayload<'admin.broadcast-sent'>) => {
      await sendAdminAlert({
        title: '📢 Broadcast Sent',
        description: `**${payload.subject}**`,
        color: ALERT_COLORS.info,
        fields: [
          { name: 'Admin ID', value: payload.adminId, inline: true },
          { name: 'Recipients', value: String(payload.recipientCount), inline: true },
          { name: 'Failed', value: String(payload.failedCount), inline: true },
          { name: 'Priority', value: payload.priority, inline: true },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  // ─────────────────────────────────────────────────────────────────────────
  // SECURITY ALERTS
  // ─────────────────────────────────────────────────────────────────────────

  events.on(
    'security.suspicious-activity',
    'admin-discord-notify',
    async (payload: EventPayload<'security.suspicious-activity'>) => {
      const severityColors: Record<string, number> = {
        low: ALERT_COLORS.info,
        medium: ALERT_COLORS.warning,
        high: ALERT_COLORS.critical,
        critical: ALERT_COLORS.security,
      }
      await sendAdminAlert({
        title: '🔒 Suspicious Activity Detected',
        description: `\`${payload.activityType}\` — ${payload.details}`,
        color: severityColors[payload.severity] ?? ALERT_COLORS.security,
        fields: [
          { name: 'Severity', value: payload.severity.toUpperCase(), inline: true },
          { name: 'Type', value: payload.activityType, inline: true },
          ...(payload.userId ? [{ name: 'User ID', value: payload.userId, inline: true }] : []),
          ...(payload.email ? [{ name: 'Email', value: payload.email, inline: true }] : []),
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'security.rate-limit-exceeded',
    'admin-discord-notify',
    async (payload: EventPayload<'security.rate-limit-exceeded'>) => {
      await sendAdminAlert({
        title: '⏱️ Rate Limit Exceeded',
        description: `Endpoint \`${payload.endpoint}\` hit the rate limit`,
        color: ALERT_COLORS.warning,
        fields: [
          { name: 'Endpoint', value: payload.endpoint, inline: true },
          { name: 'Limit', value: String(payload.limit), inline: true },
          { name: 'Window', value: payload.window, inline: true },
          ...(payload.email ? [{ name: 'Email', value: payload.email, inline: true }] : []),
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  // ─────────────────────────────────────────────────────────────────────────
  // BILLING ALERTS
  // ─────────────────────────────────────────────────────────────────────────

  events.on(
    'billing.subscription-created',
    'admin-discord-notify',
    async (payload: EventPayload<'billing.subscription-created'>) => {
      await sendAdminAlert({
        title: '✅ New Subscription',
        description: `**${payload.email}** subscribed to **${payload.planName}**`,
        color: ALERT_COLORS.success,
        fields: [
          { name: 'User', value: payload.email, inline: true },
          { name: 'Plan', value: payload.planName, inline: true },
          { name: 'Interval', value: payload.interval, inline: true },
          { name: 'Amount', value: `$${payload.amount} ${payload.currency.toUpperCase()}`, inline: true },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'billing.subscription-cancelled',
    'admin-discord-notify',
    async (payload: EventPayload<'billing.subscription-cancelled'>) => {
      await sendAdminAlert({
        title: '⛔ Subscription Cancelled',
        description: `**${payload.email}** cancelled their subscription`,
        color: ALERT_COLORS.warning,
        fields: [
          { name: 'User', value: payload.email, inline: true },
          { name: 'Plan ID', value: payload.planId, inline: true },
          { name: 'Cancelled By', value: payload.cancelledBy, inline: true },
          ...(payload.reason ? [{ name: 'Reason', value: payload.reason, inline: false }] : []),
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'billing.payment-succeeded',
    'admin-discord-notify',
    async (payload: EventPayload<'billing.payment-succeeded'>) => {
      await sendAdminAlert({
        title: '💳 Payment Received',
        description: `Payment from **${payload.email}**`,
        color: ALERT_COLORS.success,
        fields: [
          { name: 'User', value: payload.email, inline: true },
          { name: 'Amount', value: `$${payload.amount} ${payload.currency.toUpperCase()}`, inline: true },
          { name: 'Payment ID', value: payload.paymentId, inline: true },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'billing.payment-failed',
    'admin-discord-notify',
    async (payload: EventPayload<'billing.payment-failed'>) => {
      await sendAdminAlert({
        title: '❌ Payment Failed',
        description: `Payment failed for **${payload.email}**`,
        color: ALERT_COLORS.critical,
        fields: [
          { name: 'User', value: payload.email, inline: true },
          { name: 'Amount', value: `$${payload.amount} ${payload.currency.toUpperCase()}`, inline: true },
          { name: 'Reason', value: payload.failureReason, inline: false },
          ...(payload.paymentId ? [{ name: 'Payment ID', value: payload.paymentId, inline: true }] : []),
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'billing.refund-issued',
    'admin-discord-notify',
    async (payload: EventPayload<'billing.refund-issued'>) => {
      await sendAdminAlert({
        title: '💰 Refund Issued',
        description: `Refund of **$${payload.amount}** issued to **${payload.email}**`,
        color: ALERT_COLORS.info,
        fields: [
          { name: 'User', value: payload.email, inline: true },
          { name: 'Amount', value: `$${payload.amount} ${payload.currency.toUpperCase()}`, inline: true },
          { name: 'Refund ID', value: payload.refundId, inline: true },
          { name: 'Payment ID', value: payload.paymentId, inline: true },
          ...(payload.reason ? [{ name: 'Reason', value: payload.reason, inline: false }] : []),
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  // ─────────────────────────────────────────────────────────────────────────
  // ACCOUNT ALERTS
  // ─────────────────────────────────────────────────────────────────────────

  events.on(
    'account.deleted',
    'admin-discord-notify',
    async (payload: EventPayload<'account.deleted'>) => {
      await sendAdminAlert({
        title: '👤 Account Deleted',
        description: `Account **${payload.email}** permanently deleted`,
        color: ALERT_COLORS.warning,
        fields: [
          { name: 'User ID', value: payload.userId, inline: true },
          { name: 'Email', value: payload.email, inline: true },
          { name: 'Deleted By', value: payload.deletedBy, inline: true },
          ...(payload.reason ? [{ name: 'Reason', value: payload.reason, inline: false }] : []),
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  // ─────────────────────────────────────────────────────────────────────────
  // BAN ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  events.on(
    'admin.user-banned',
    'admin-discord-notify',
    async (payload: EventPayload<'admin.user-banned'>) => {
      const duration = payload.banType === 'permanent'
        ? 'Permanent'
        : payload.expiresAt
          ? `Until ${payload.expiresAt.toUTCString()}`
          : 'Temporary'
      await sendAdminAlert({
        title: '🔨 User Banned',
        description: `**${payload.targetName}** (${payload.targetEmail}) has been banned`,
        color: ALERT_COLORS.critical,
        fields: [
          { name: 'Admin', value: `${payload.adminName} (${payload.adminId})`, inline: true },
          { name: 'Target', value: `${payload.targetName} (${payload.targetId})`, inline: true },
          { name: 'Ban Type', value: payload.banType.toUpperCase(), inline: true },
          { name: 'Duration', value: duration, inline: true },
          { name: 'Reason', value: payload.reason, inline: false },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'admin.user-unbanned',
    'admin-discord-notify',
    async (payload: EventPayload<'admin.user-unbanned'>) => {
      await sendAdminAlert({
        title: '✅ User Unbanned',
        description: `**${payload.targetName}** (${payload.targetEmail}) has been unbanned`,
        color: ALERT_COLORS.success,
        fields: [
          { name: 'Admin', value: `${payload.adminName} (${payload.adminId})`, inline: true },
          { name: 'Target', value: `${payload.targetName} (${payload.targetId})`, inline: true },
          ...(payload.reason ? [{ name: 'Reason', value: payload.reason, inline: false }] : []),
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  // ─────────────────────────────────────────────────────────────────────────
  // MODERATION ALERTS
  // ─────────────────────────────────────────────────────────────────────────

  events.on(
    'moderation.user-reported',
    'admin-discord-notify',
    async (payload: EventPayload<'moderation.user-reported'>) => {
      await sendAdminAlert({
        title: '🚨 User Reported',
        description: `**${payload.reportedUserName}** was reported by **${payload.reporterUserName}**`,
        color: ALERT_COLORS.warning,
        fields: [
          { name: 'Report ID', value: payload.reportId, inline: true },
          { name: 'Reported User', value: `${payload.reportedUserName} (${payload.reportedUserId})`, inline: true },
          { name: 'Reporter', value: `${payload.reporterUserName} (${payload.reporterUserId})`, inline: true },
          { name: 'Category', value: payload.category, inline: true },
          { name: 'Reason', value: payload.reason, inline: false },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'moderation.squad-reported',
    'admin-discord-notify',
    async (payload: EventPayload<'moderation.squad-reported'>) => {
      await sendAdminAlert({
        title: '🚨 Squad Reported',
        description: `Squad **${payload.squadName}** was reported by **${payload.reporterUserName}**`,
        color: ALERT_COLORS.warning,
        fields: [
          { name: 'Report ID', value: payload.reportId, inline: true },
          { name: 'Squad', value: `${payload.squadName} (${payload.squadId})`, inline: true },
          { name: 'Reporter', value: `${payload.reporterUserName} (${payload.reporterUserId})`, inline: true },
          { name: 'Category', value: payload.category, inline: true },
          { name: 'Reason', value: payload.reason, inline: false },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  // ─────────────────────────────────────────────────────────────────────────
  // APPLICATION ALERTS
  // ─────────────────────────────────────────────────────────────────────────

  events.on(
    'application.submitted',
    'admin-discord-notify',
    async (payload: EventPayload<'application.submitted'>) => {
      await sendAdminAlert({
        title: '📋 Application Submitted',
        description: `**${payload.userName}** submitted a **${payload.type}** application`,
        color: ALERT_COLORS.info,
        fields: [
          { name: 'Application ID', value: payload.applicationId, inline: true },
          { name: 'Applicant', value: `${payload.userName} (${payload.userId})`, inline: true },
          { name: 'Email', value: payload.userEmail, inline: true },
          { name: 'Type', value: payload.type, inline: true },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  // ─────────────────────────────────────────────────────────────────────────
  // TESTIMONIAL ALERTS
  // ─────────────────────────────────────────────────────────────────────────

  events.on(
    'testimonial.submitted',
    'admin-discord-notify',
    async (payload: EventPayload<'testimonial.submitted'>) => {
      await sendAdminAlert({
        title: '💬 Testimonial Submitted',
        description: `**${payload.userName}** submitted a new testimonial`,
        color: ALERT_COLORS.info,
        fields: [
          { name: 'Testimonial ID', value: payload.testimonialId, inline: true },
          { name: 'User', value: `${payload.userName} (${payload.userId})`, inline: true },
          { name: 'Email', value: payload.userEmail, inline: true },
          { name: 'Preview', value: payload.contentPreview, inline: false },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'testimonial.edited',
    'admin-discord-notify',
    async (payload: EventPayload<'testimonial.edited'>) => {
      await sendAdminAlert({
        title: '✏️ Testimonial Edited',
        description: `**${payload.userName}** edited their testimonial`,
        color: ALERT_COLORS.info,
        fields: [
          { name: 'Testimonial ID', value: payload.testimonialId, inline: true },
          { name: 'User', value: `${payload.userName} (${payload.userId})`, inline: true },
          { name: 'Email', value: payload.userEmail, inline: true },
          { name: 'Preview', value: payload.contentPreview, inline: false },
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  // ─────────────────────────────────────────────────────────────────────────
  // SYSTEM ERROR ALERTS
  // ─────────────────────────────────────────────────────────────────────────

  events.on(
    'system.client-error',
    'admin-discord-notify',
    async (payload: EventPayload<'system.client-error'>) => {
      await sendAdminAlert({
        title: '🐛 Client Error',
        description: `\`${payload.message}\``,
        color: 0xffff00, // Yellow
        fields: [
          { name: 'URL', value: payload.url, inline: false },
          ...(payload.userId ? [{ name: 'User ID', value: payload.userId, inline: true }] : []),
          ...(payload.userAgent ? [{ name: 'User Agent', value: payload.userAgent, inline: false }] : []),
          ...(payload.stack ? [{ name: 'Stack', value: payload.stack.slice(0, 1024), inline: false }] : []),
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )

  events.on(
    'system.server-error',
    'admin-discord-notify',
    async (payload: EventPayload<'system.server-error'>) => {
      await sendAdminAlert({
        title: '💥 Server Error',
        description: `\`${payload.message}\``,
        color: ALERT_COLORS.critical,
        fields: [
          { name: 'URL', value: payload.url, inline: false },
          ...(payload.statusCode ? [{ name: 'Status Code', value: String(payload.statusCode), inline: true }] : []),
          ...(payload.userId ? [{ name: 'User ID', value: payload.userId, inline: true }] : []),
          ...(payload.stack ? [{ name: 'Stack', value: payload.stack.slice(0, 1024), inline: false }] : []),
        ],
        timestamp: new Date(),
      })
    },
    { enabled: true, timeout: 5000 }
  )
}
