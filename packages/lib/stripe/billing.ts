/**
 * Centralized Stripe billing service.
 * Consolidates subscription and payment operations shared across routes.
 */
import Stripe from 'stripe'

import { Subscription } from '@/prisma/generated/prisma/client'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { getStripeClient, isStripeConfigured } from './client'
import { applyReferralCreditsToStripe, ensureStripeCustomer } from './credits'

const logger = loggers.api

// Re-export for callers that only import from billing
export { ensureStripeCustomer }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckoutSessionOptions {
    userId: string
    email: string | null | undefined
    priceId: string
    successUrl: string
    cancelUrl: string
    /** @default 'subscription' */
    mode?: Stripe.Checkout.SessionCreateParams.Mode
    metadata?: Record<string, string>
    /** Apply any pending referral credits to the customer before creating the session */
    applyCredits?: boolean
    quantity?: number
}

export interface PortalSessionOptions {
    userId: string
    returnUrl: string
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Gets or creates a Stripe customer for the given user, persisting the ID to
 * the database.  Delegates to `ensureStripeCustomer` in credits.ts which
 * already handles validation of stale/test-mode IDs.
 */
export async function getOrCreateStripeCustomer(
    userId: string,
    email: string | null | undefined
): Promise<string> {
    const stripe = await getStripeClient()
    return ensureStripeCustomer(userId, email, stripe)
}

/**
 * Creates a Stripe Checkout session.
 *
 * If `applyCredits` is true, any pending referral credits for the user are
 * applied to their Stripe customer balance before the session is created so
 * Stripe can automatically discount the invoice.
 */
export async function createCheckoutSession(
    opts: CheckoutSessionOptions
): Promise<Stripe.Checkout.Session> {
    const {
        userId,
        email,
        priceId,
        successUrl,
        cancelUrl,
        mode = 'subscription',
        metadata,
        applyCredits = false,
        quantity = 1,
    } = opts

    const stripe = await getStripeClient()
    const customerId = await ensureStripeCustomer(userId, email, stripe)

    let creditsAppliedCents = 0

    if (applyCredits) {
        const creditsResult = await applyReferralCreditsToStripe(userId, stripe, {
            relatedOrderId: priceId,
        })
        if (creditsResult.applied) {
            creditsAppliedCents = Math.round(creditsResult.creditAmount * 100)
            logger.info(
                `[Billing] Applied $${creditsResult.creditAmount} referral credits for user ${userId}`
            )
        }
    }

    const session = await stripe.checkout.sessions.create({
        mode,
        customer: customerId,
        line_items: [{ price: priceId, quantity }],
        allow_promotion_codes: true,
        client_reference_id: userId,
        metadata: {
            userId,
            ...metadata,
            ...(creditsAppliedCents > 0 ? { creditsAppliedCents: String(creditsAppliedCents) } : {}),
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
    })

    logger.info(`[Billing] Checkout session created`, {
        userId,
        sessionId: session.id,
        mode,
    })

    return session
}

/**
 * Creates a Stripe Customer Portal session so the user can manage their
 * subscription, payment methods, and invoices.
 */
export async function createPortalSession(
    opts: PortalSessionOptions
): Promise<Stripe.BillingPortal.Session> {
    const { userId, returnUrl } = opts

    const stripe = await getStripeClient()

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, stripeCustomerId: true },
    })

    if (!user) throw new Error(`User ${userId} not found`)

    const customerId = await ensureStripeCustomer(userId, user.email, stripe)

    const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    })

    logger.info(`[Billing] Portal session created`, { userId })

    return portal
}

/**
 * Cancels a Stripe subscription.
 *
 * @param cancelAtPeriodEnd  When `true` (default) the subscription remains
 *   active until the end of the billing period rather than being cancelled
 *   immediately.
 */
export async function cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd = true
): Promise<void> {
    const stripe = await getStripeClient()

    if (cancelAtPeriodEnd) {
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        })
    } else {
        await stripe.subscriptions.cancel(subscriptionId)
    }

    logger.info(`[Billing] Subscription ${subscriptionId} cancelled`, {
        cancelAtPeriodEnd,
    })
}

/**
 * Returns the user's active (or trialing) Stripe subscription record from the
 * database, including the associated product details.  Returns `null` when no
 * active subscription exists.
 */
export async function getActiveSubscription(
    userId: string
): Promise<(Subscription & { product: { id: string; name: string; metadata: unknown } }) | null> {
    const subscription = await prisma.subscription.findFirst({
        where: {
            userId,
            status: { in: ['active', 'trialing'] },
        },
        include: {
            product: {
                select: { id: true, name: true, metadata: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return subscription
}

export interface UpsertSubscriptionOptions {
    userId: string
    stripeSubscriptionId: string
    productId: string
    status: string
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd?: boolean
    metadata?: Record<string, string>
}

/**
 * Upserts a subscription record in the database from Stripe webhook data.
 * Used by the webhook handler to consolidate repeated create/upsert patterns.
 */
export async function upsertSubscriptionRecord(opts: UpsertSubscriptionOptions): Promise<void> {
    const {
        userId,
        stripeSubscriptionId,
        productId,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd = false,
        metadata = {},
    } = opts

    await prisma.subscription.upsert({
        where: { stripeSubscriptionId },
        create: {
            userId,
            productId,
            stripeSubscriptionId,
            status,
            currentPeriodEnd,
            cancelAtPeriodEnd,
            metadata,
        },
        update: {
            status,
            currentPeriodEnd,
            cancelAtPeriodEnd,
            metadata,
        },
    })

    logger.info(`[Billing] Subscription record upserted`, { stripeSubscriptionId, status })
}

/**
 * Fetches all active Stripe subscriptions for a customer and syncs them into
 * the local database.  Safe to call repeatedly — all operations are idempotent.
 * Handles the Stripe Clover API where current_period_end lives on the item.
 */
export async function syncUserSubscriptionsFromStripe(
    userId: string,
    stripeCustomerId: string,
): Promise<void> {
    if (!await isStripeConfigured()) return

    const stripe = await getStripeClient()

    const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 20,
        // Can only expand 4 levels deep in a list: data.items.data.price
        // (data.items.data.price.product would be 5 levels — not allowed)
        expand: ['data.items.data.price'],
    })

    for (const sub of subs.data) {
        const firstItem = sub.items.data[0]
        const price = firstItem?.price
        // price.product is a string ID (not expanded) — look it up in our DB
        const stripeProductId = (price?.product as any as string) ?? null

        // Clover API: current_period_end moved to item level
        const rawPeriodEnd =
            (sub as any).current_period_end ?? (firstItem as any)?.current_period_end
        const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000) : null

        // Map Stripe product ID → internal DB product
        const dbProduct = stripeProductId
            ? await prisma.product.findFirst({ where: { stripeProductId } })
            : null

        if (!dbProduct) {
            logger.warn(`[sync] No DB product matched for Stripe product "${stripeProductId}" — skipping sub ${sub.id}`)
            continue
        }

        await upsertSubscriptionRecord({
            userId,
            productId: dbProduct.id,
            stripeSubscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            metadata: (sub.metadata as Record<string, string>) || {},
        })
    }

    logger.info(`[sync] Synced ${subs.data.length} Stripe subscription(s) for user ${userId}`)
}
