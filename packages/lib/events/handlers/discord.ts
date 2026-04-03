import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'
import { notifyDiscord } from '../utils/discord-webhook'
import { formatBytes } from '@/packages/lib/utils'

import { events } from '../index'
import { shouldSendDiscord } from '../utils/discord-preferences'

const logger = loggers.events.getChildLogger('discord-handler')

// ─────────────────────────────────────────────────────────────────────────────
// Color constants for Discord embeds
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
    success: 0x22c55e,
    warning: 0xf59e0b,
    error: 0xef4444,
    info: 0x6366f1,
    security: 0x3b82f6,
    billing: 0xa855f7,
}

/**
 * Send a Discord webhook notification to a user's configured webhook URL.
 */
async function sendUserDiscordNotification(
    userId: string,
    embed: {
        title: string
        description?: string
        color: number
        fields?: Array<{ name: string; value: string; inline?: boolean }>
    },
    sourceEvent: string
): Promise<void> {
    const { shouldSend, webhookUrl, reason } = await shouldSendDiscord(userId, sourceEvent)

    if (!shouldSend || !webhookUrl) {
        logger.debug('Discord notification skipped', { userId, sourceEvent, reason })
        return
    }

    await notifyDiscord({
        webhookUrl,
        embeds: [embed],
    })

    logger.info('Discord notification sent', { userId, sourceEvent })
}

/**
 * Register Discord notification event handlers
 */
export function registerDiscordHandlers(): void {
    // ─────────────────────────────────────────────────────────────────────────
    // Billing notifications
    // ─────────────────────────────────────────────────────────────────────────

    events.on(
        'billing.subscription-created',
        'discord-notify',
        async (payload: EventPayload<'billing.subscription-created'>) => {
            await sendUserDiscordNotification(payload.userId, {
                title: '🎉 Subscription Created',
                description: `You've subscribed to **${payload.planName}**!`,
                color: COLORS.success,
                fields: [
                    { name: 'Plan', value: payload.planName, inline: true },
                    { name: 'Interval', value: payload.interval, inline: true },
                    { name: 'Amount', value: `$${payload.amount} ${payload.currency.toUpperCase()}`, inline: true },
                ],
            }, 'billing.subscription-created')
        },
        { enabled: true, timeout: 10000 }
    )

    events.on(
        'billing.subscription-cancelled',
        'discord-notify',
        async (payload: EventPayload<'billing.subscription-cancelled'>) => {
            await sendUserDiscordNotification(payload.userId, {
                title: '😔 Subscription Cancelled',
                description: 'Your Emberly subscription has been cancelled.',
                color: COLORS.warning,
                fields: [
                    { name: 'Effective', value: payload.effectiveAt.toISOString().split('T')[0], inline: true },
                    ...(payload.reason ? [{ name: 'Reason', value: payload.reason, inline: true }] : []),
                ],
            }, 'billing.subscription-cancelled')
        },
        { enabled: true, timeout: 10000 }
    )

    events.on(
        'billing.payment-succeeded',
        'discord-notify',
        async (payload: EventPayload<'billing.payment-succeeded'>) => {
            await sendUserDiscordNotification(payload.userId, {
                title: '💰 Payment Received',
                description: 'Your payment has been processed successfully.',
                color: COLORS.success,
                fields: [
                    { name: 'Amount', value: `$${payload.amount} ${payload.currency.toUpperCase()}`, inline: true },
                    ...(payload.receiptUrl ? [{ name: 'Receipt', value: `[View receipt](${payload.receiptUrl})`, inline: true }] : []),
                ],
            }, 'billing.payment-succeeded')
        },
        { enabled: true, timeout: 10000 }
    )

    events.on(
        'billing.payment-failed',
        'discord-notify',
        async (payload: EventPayload<'billing.payment-failed'>) => {
            await sendUserDiscordNotification(payload.userId, {
                title: '⚠️ Payment Failed',
                description: 'We were unable to process your payment.',
                color: COLORS.error,
                fields: [
                    { name: 'Amount', value: `$${payload.amount} ${payload.currency.toUpperCase()}`, inline: true },
                    { name: 'Reason', value: payload.failureReason, inline: true },
                    ...(payload.nextRetryAt ? [{ name: 'Next Retry', value: payload.nextRetryAt.toISOString().split('T')[0], inline: true }] : []),
                ],
            }, 'billing.payment-failed')
        },
        { enabled: true, timeout: 10000 }
    )

    // ─────────────────────────────────────────────────────────────────────────
    // Security notifications
    // ─────────────────────────────────────────────────────────────────────────

    events.on(
        'security.suspicious-activity',
        'discord-notify',
        async (payload: EventPayload<'security.suspicious-activity'>) => {
            if (!payload.userId) return
            await sendUserDiscordNotification(payload.userId, {
                title: '🚨 Suspicious Activity Detected',
                description: payload.details,
                color: COLORS.error,
                fields: [
                    { name: 'Type', value: payload.activityType, inline: true },
                    { name: 'Severity', value: payload.severity.toUpperCase(), inline: true },
                    ...(payload.context?.ip ? [{ name: 'IP', value: payload.context.ip, inline: true }] : []),
                ],
            }, 'security.suspicious-activity')
        },
        { enabled: true, timeout: 10000 }
    )

    events.on(
        'security.api-key-created',
        'discord-notify',
        async (payload: EventPayload<'security.api-key-created'>) => {
            await sendUserDiscordNotification(payload.userId, {
                title: '🔑 API Key Created',
                description: `A new API key \`${payload.keyName}\` has been created.`,
                color: COLORS.info,
                fields: [
                    { name: 'Key Name', value: payload.keyName, inline: true },
                    { name: 'Scopes', value: payload.scopes.join(', ') || 'All', inline: true },
                ],
            }, 'security.api-key-created')
        },
        { enabled: true, timeout: 10000 }
    )

    events.on(
        'security.api-key-revoked',
        'discord-notify',
        async (payload: EventPayload<'security.api-key-revoked'>) => {
            await sendUserDiscordNotification(payload.userId, {
                title: '🔒 API Key Revoked',
                description: `API key \`${payload.keyName}\` has been revoked.`,
                color: COLORS.warning,
                fields: [
                    { name: 'Key Name', value: payload.keyName, inline: true },
                    { name: 'Revoked By', value: payload.revokedBy, inline: true },
                ],
            }, 'security.api-key-revoked')
        },
        { enabled: true, timeout: 10000 }
    )

    // ─────────────────────────────────────────────────────────────────────────
    // Auth notifications
    // ─────────────────────────────────────────────────────────────────────────

    events.on(
        'auth.login',
        'discord-notify',
        async (payload: EventPayload<'auth.login'>) => {
            if (!payload.success || !payload.isNewDevice) return
            await sendUserDiscordNotification(payload.userId, {
                title: '🔐 New Device Login',
                description: 'A new device was used to sign in to your account.',
                color: COLORS.security,
                fields: [
                    { name: 'Method', value: payload.method, inline: true },
                    ...(payload.context?.ip ? [{ name: 'IP', value: payload.context.ip, inline: true }] : []),
                    ...(payload.context?.geo?.city ? [{ name: 'Location', value: `${payload.context.geo.city}, ${payload.context.geo.country}`, inline: true }] : []),
                ],
            }, 'auth.login')
        },
        { enabled: true, timeout: 10000 }
    )

    // ─────────────────────────────────────────────────────────────────────────
    // File notifications
    // ─────────────────────────────────────────────────────────────────────────

    events.on(
        'file.uploaded',
        'discord-notify',
        async (payload: EventPayload<'file.uploaded'>) => {
            await sendUserDiscordNotification(payload.userId, {
                title: '📁 File Uploaded',
                color: COLORS.info,
                fields: [
                    { name: 'File', value: payload.fileName, inline: true },
                    { name: 'Size', value: formatBytes(payload.fileSize), inline: true },
                    { name: 'Visibility', value: payload.visibility, inline: true },
                ],
            }, 'file.uploaded')
        },
        { enabled: true, timeout: 10000 }
    )

    logger.debug('Discord event handlers registered')
}
