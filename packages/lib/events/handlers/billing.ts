import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'
import { prisma } from '@/packages/lib/database/prisma'
import { syncDiscordSupporterRole } from '@/packages/lib/perks/discord'

import { events } from '../index'

const logger = loggers.events.getChildLogger('billing-handler')

/**
 * Register billing event handlers
 */
export function registerBillingHandlers(): void {
    // ─────────────────────────────────────────────────────────────────────────────
    // Subscription events
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'billing.subscription-created',
        'send-confirmation',
        async (payload: EventPayload<'billing.subscription-created'>) => {
            logger.info('Subscription created', {
                userId: payload.userId,
                planId: payload.planId,
                interval: payload.interval,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'subscription-created',
                subject: `Welcome to Emberly ${payload.planName}!`,
                variables: {
                    email: payload.email,
                    planName: payload.planName,
                    interval: payload.interval,
                    amount: payload.amount,
                    currency: payload.currency,
                },
                userId: payload.userId,
                priority: 'normal',
                sourceEvent: 'billing.subscription-created',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    events.on(
        'billing.subscription-updated',
        'send-confirmation',
        async (payload: EventPayload<'billing.subscription-updated'>) => {
            logger.info('Subscription updated', {
                userId: payload.userId,
                changeType: payload.changeType,
                newPlanId: payload.newPlanId,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'subscription-updated',
                subject: `Your Emberly subscription has been ${payload.changeType}d`,
                variables: {
                    email: payload.email,
                    changeType: payload.changeType,
                    newPlanName: payload.newPlanName,
                },
                userId: payload.userId,
                priority: 'normal',
                sourceEvent: 'billing.subscription-updated',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    events.on(
        'billing.subscription-cancelled',
        'send-confirmation',
        async (payload: EventPayload<'billing.subscription-cancelled'>) => {
            logger.info('Subscription cancelled', {
                userId: payload.userId,
                planId: payload.planId,
                cancelledBy: payload.cancelledBy,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'subscription-cancelled',
                subject: 'Your Emberly subscription has been cancelled',
                variables: {
                    email: payload.email,
                    effectiveAt: payload.effectiveAt.toISOString(),
                    reason: payload.reason,
                },
                userId: payload.userId,
                priority: 'normal',
                sourceEvent: 'billing.subscription-cancelled',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Payment events
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'billing.payment-succeeded',
        'send-receipt',
        async (payload: EventPayload<'billing.payment-succeeded'>) => {
            logger.info('Payment succeeded', {
                userId: payload.userId,
                paymentId: payload.paymentId,
                amount: payload.amount,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'payment-succeeded',
                subject: 'Payment receipt from Emberly',
                variables: {
                    email: payload.email,
                    amount: payload.amount,
                    currency: payload.currency,
                    receiptUrl: payload.receiptUrl,
                    invoiceId: payload.invoiceId,
                },
                userId: payload.userId,
                priority: 'normal',
                sourceEvent: 'billing.payment-succeeded',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    events.on(
        'billing.payment-failed',
        'send-alert',
        async (payload: EventPayload<'billing.payment-failed'>) => {
            logger.warn('Payment failed', {
                userId: payload.userId,
                amount: payload.amount,
                reason: payload.failureReason,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'payment-failed',
                subject: '⚠️ Your Emberly payment failed',
                variables: {
                    email: payload.email,
                    amount: payload.amount,
                    currency: payload.currency,
                    failureReason: payload.failureReason,
                    nextRetryAt: payload.nextRetryAt?.toISOString(),
                    updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
                },
                userId: payload.userId,
                priority: 'high',
                sourceEvent: 'billing.payment-failed',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    events.on(
        'billing.refund-issued',
        'send-confirmation',
        async (payload: EventPayload<'billing.refund-issued'>) => {
            logger.info('Refund issued', {
                userId: payload.userId,
                refundId: payload.refundId,
                amount: payload.amount,
            })

            await events.emit('email.send', {
                to: payload.email,
                template: 'refund-issued',
                subject: 'Your Emberly refund has been processed',
                variables: {
                    email: payload.email,
                    amount: payload.amount,
                    currency: payload.currency,
                    reason: payload.reason,
                },
                userId: payload.userId,
                priority: 'normal',
                sourceEvent: 'billing.refund-issued',
            })
        },
        { enabled: true, timeout: 15000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // Discord supporter role sync
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'billing.subscription-created',
        'sync-discord-supporter-role',
        async (payload: EventPayload<'billing.subscription-created'>) => {
            const discordId = await getLinkedDiscordId(payload.userId)
            if (discordId) {
                await syncDiscordSupporterRole(payload.userId, discordId)
            }
        },
        { enabled: true, timeout: 10000 }
    )

    events.on(
        'billing.subscription-cancelled',
        'sync-discord-supporter-role',
        async (payload: EventPayload<'billing.subscription-cancelled'>) => {
            const discordId = await getLinkedDiscordId(payload.userId)
            if (discordId) {
                await syncDiscordSupporterRole(payload.userId, discordId)
            }
        },
        { enabled: true, timeout: 10000 }
    )

    logger.debug('Billing event handlers registered')
}

// ---------------------------------------------------------------------------
// Internal helper — looks up a user's linked Discord account
// ---------------------------------------------------------------------------
async function getLinkedDiscordId(userId: string): Promise<string | null> {
    const account = await prisma.linkedAccount.findFirst({
        where: { userId, provider: 'discord' },
        select: { providerUserId: true },
    })
    return account?.providerUserId ?? null
}
