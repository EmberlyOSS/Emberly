import type { EventType } from '@/packages/types/events'
import type { EmailPreferences } from '@/packages/types/dto/profile'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.events.getChildLogger('discord-preferences')

/**
 * Maps event types to notification preference categories.
 * Reuses the same category keys as email preferences.
 */
const EVENT_TO_PREFERENCE_MAP: Record<string, keyof EmailPreferences> = {
    // Security events
    'auth.login': 'security',
    'auth.password-changed': 'security',
    'auth.2fa-enabled': 'security',
    'auth.2fa-disabled': 'security',
    'security.suspicious-activity': 'security',
    'security.api-key-created': 'security',
    'security.api-key-revoked': 'security',

    // Account events
    'account.profile-updated': 'account',
    'account.email-changed': 'account',
    'account.deletion-requested': 'account',

    // Billing events
    'billing.subscription-created': 'billing',
    'billing.subscription-updated': 'billing',
    'billing.subscription-cancelled': 'billing',
    'billing.payment-succeeded': 'billing',
    'billing.payment-failed': 'billing',
    'billing.refund-issued': 'billing',

    // Product/feature events
    'user.perk-gained': 'productUpdates',
    'user.quota-reached': 'account',
    'user.storage-assigned': 'productUpdates',
    'file.uploaded': 'productUpdates',

    // Application events
    'application.reviewed': 'account',
}

const DEFAULT_DISCORD_PREFERENCES: EmailPreferences = {
    security: true,
    account: false,
    billing: true,
    marketing: false,
    productUpdates: false,
}

/**
 * Check if a Discord notification should be sent to a user based on their preferences.
 */
export async function shouldSendDiscord(
    userId: string | undefined,
    eventType: string
): Promise<{ shouldSend: boolean; webhookUrl?: string; reason?: string }> {
    if (!userId) {
        return { shouldSend: false, reason: 'No user ID provided' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                discordWebhookUrl: true,
                discordNotificationsEnabled: true,
                discordPreferences: true,
            },
        })

        if (!user) {
            return { shouldSend: false, reason: 'User not found' }
        }

        if (!user.discordWebhookUrl) {
            return { shouldSend: false, reason: 'No webhook URL configured' }
        }

        if (!user.discordNotificationsEnabled) {
            return { shouldSend: false, reason: 'User has disabled Discord notifications' }
        }

        // Check category preference
        const preferenceKey = EVENT_TO_PREFERENCE_MAP[eventType]
        if (!preferenceKey) {
            return { shouldSend: false, reason: 'No preference mapping for event' }
        }

        const preferences = (user.discordPreferences as EmailPreferences) || DEFAULT_DISCORD_PREFERENCES
        const isEnabled = preferences[preferenceKey] ?? false

        if (!isEnabled) {
            return {
                shouldSend: false,
                reason: `User has disabled ${preferenceKey} Discord notifications`,
            }
        }

        return { shouldSend: true, webhookUrl: user.discordWebhookUrl }
    } catch (error) {
        logger.error('Error checking Discord preferences', error as Error, { userId, eventType })
        return { shouldSend: false, reason: 'Error checking preferences' }
    }
}
