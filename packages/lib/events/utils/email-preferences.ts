import type { EventType } from '@/packages/types/events'
import type { EmailPreferences } from '@/packages/types/dto/profile'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.events.getChildLogger('email-preferences')

/**
 * Maps event types to email preference categories
 */
const EVENT_TO_PREFERENCE_MAP: Record<string, keyof EmailPreferences> = {
    // Security events
    'auth.login': 'security',
    'auth.logout': 'security',
    'auth.password-changed': 'security',
    'auth.password-reset-requested': 'security',
    'auth.password-reset-completed': 'security',
    'auth.2fa-enabled': 'security',
    'auth.2fa-disabled': 'security',
    'auth.2fa-backup-codes-generated': 'security',
    'auth.2fa-backup-code-used': 'security',
    'auth.session-revoked': 'security',
    'security.suspicious-activity': 'security',
    'security.rate-limit-exceeded': 'security',
    'security.api-key-created': 'security',
    'security.api-key-revoked': 'security',

    // Account events
    'account.created': 'account',
    'account.email-changed': 'account',
    'account.email-verified': 'account',
    'account.profile-updated': 'account',
    'account.export-requested': 'account',
    'account.export-completed': 'account',
    'account.deletion-requested': 'account',
    'account.deletion-cancelled': 'account',
    'account.deleted': 'account',

    // Billing events
    'billing.subscription-created': 'billing',
    'billing.subscription-updated': 'billing',
    'billing.subscription-cancelled': 'billing',
    'billing.payment-succeeded': 'billing',
    'billing.payment-failed': 'billing',
    'billing.refund-issued': 'billing',

    // Admin events (always sent, no preference)
    'admin.user-role-changed': 'account',
    'admin.user-suspended': 'account',
    'admin.user-unsuspended': 'account',
    'admin.content-removed': 'account',
}

/**
 * Events that should ALWAYS be sent regardless of user preferences.
 * These are critical transactional emails.
 */
const ALWAYS_SEND_EVENTS: EventType[] = [
    'auth.password-reset-requested', // Can't disable password reset emails
    'account.email-verified', // Verification emails must always be sent
]

/**
 * Default email preferences for new users
 */
export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
    security: true,
    account: true,
    billing: true,
    marketing: false,
    productUpdates: true,
}

/**
 * Check if an email should be sent to a user based on their preferences
 */
export async function shouldSendEmail(
    userId: string | undefined,
    eventType: EventType
): Promise<{ shouldSend: boolean; reason?: string }> {
    // Always send critical transactional emails
    if (ALWAYS_SEND_EVENTS.includes(eventType)) {
        return { shouldSend: true, reason: 'Critical transactional email' }
    }

    // If no user ID, we can't check preferences - send by default
    if (!userId) {
        return { shouldSend: true, reason: 'No user ID provided' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailNotificationsEnabled: true,
                emailPreferences: true,
            },
        })

        if (!user) {
            logger.warn('User not found for email preference check', { userId })
            return { shouldSend: true, reason: 'User not found' }
        }

        // Master toggle off = no emails
        if (!user.emailNotificationsEnabled) {
            return {
                shouldSend: false,
                reason: 'User has disabled all email notifications',
            }
        }

        // Get the preference category for this event
        const preferenceKey = EVENT_TO_PREFERENCE_MAP[eventType]
        if (!preferenceKey) {
            // Unknown event type, send by default
            logger.debug('No preference mapping for event type', { eventType })
            return { shouldSend: true, reason: 'No preference mapping' }
        }

        // Check the specific preference
        const preferences = (user.emailPreferences as EmailPreferences) || DEFAULT_EMAIL_PREFERENCES
        const isEnabled = preferences[preferenceKey] ?? true

        if (!isEnabled) {
            return {
                shouldSend: false,
                reason: `User has disabled ${preferenceKey} notifications`,
            }
        }

        return { shouldSend: true }
    } catch (error) {
        logger.error('Error checking email preferences', error as Error, { userId, eventType })
        // On error, send the email (fail open for transactional emails)
        return { shouldSend: true, reason: 'Error checking preferences' }
    }
}

/**
 * Get the preference category for an event type
 */
export function getPreferenceCategory(eventType: EventType): keyof EmailPreferences | undefined {
    return EVENT_TO_PREFERENCE_MAP[eventType]
}

/**
 * Check if an event type should always be sent
 */
export function isAlwaysSendEvent(eventType: EventType): boolean {
    return ALWAYS_SEND_EVENTS.includes(eventType)
}
