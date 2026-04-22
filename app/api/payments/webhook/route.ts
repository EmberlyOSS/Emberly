import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { prisma } from '@/packages/lib/database/prisma'
import { auditPaymentFailed, auditRefundIssued } from '@/packages/lib/events/audit-helper'
import { events } from '@/packages/lib/events'
import { loggers } from '@/packages/lib/logger'
import { upsertSubscriptionRecord } from '@/packages/lib/stripe/billing'
import { getStripeClient, isStripeConfigured } from '@/packages/lib/stripe/client'
import { getIntegrations } from '@/packages/lib/config'
import {
    createObjectStorageBucket,
    deleteObjectStorageBucket,
} from '@/packages/lib/vultr'

const logger = loggers.api

async function settleAppliedCredits(
    userId: string,
    amountCents: number,
    relatedOrderId: string,
    description: string,
    metadata?: Record<string, unknown>,
) {
    if (amountCents <= 0) return

    await prisma.$transaction(async (tx) => {
        const existing = await tx.creditTransaction.findFirst({
            where: {
                userId,
                type: { in: ['applied_checkout', 'applied_purchase'] },
                relatedOrderId,
            },
            select: { id: true },
        })

        if (existing) return

        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { referralCredits: true },
        })

        const availableCreditCents = Math.max(0, Math.round((user?.referralCredits || 0) * 100))
        const deductionCents = Math.min(amountCents, availableCreditCents)

        if (deductionCents > 0) {
            await tx.user.update({
                where: { id: userId },
                data: {
                    referralCredits: {
                        decrement: deductionCents / 100,
                    },
                },
            })
        }

        await tx.creditTransaction.create({
            data: {
                userId,
                type: 'applied_purchase',
                amountCents: -amountCents,
                description,
                relatedOrderId,
                metadata: {
                    ...(metadata || {}),
                    settledFromReferralCreditsCents: deductionCents,
                },
            },
        })
    })
}

export async function POST(req: Request) {
    const integrations = await getIntegrations()
    const webhookSecret = integrations.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK

    if (!await isStripeConfigured() || !webhookSecret) {
        logger.warn('Stripe secret or webhook secret not configured')
        return NextResponse.json({ ok: true })
    }

    const buf = await req.arrayBuffer()
    const raw = Buffer.from(buf)

    try {
        const stripe = await getStripeClient()
        const signature = req.headers.get('stripe-signature') || ''

        const event = stripe.webhooks.constructEvent(raw, signature, webhookSecret)

        // handle relevant events
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any
                // subscription or one-off payment
                if (session.mode === 'subscription' || session.subscription) {
                    const subId = session.subscription
                    // fetch subscription to get product/price info
                    const stripeSub = await stripe.subscriptions.retrieve(subId, { expand: ['items.data.price.product'] })
                    const customer = stripeSub.customer as string
                    const product = (stripeSub.items.data[0].price.product as any)?.id || null
                    // Clover API: current_period_end moved to item level
                    const rawPeriodEnd = (stripeSub as any).current_period_end ?? (stripeSub.items.data[0] as any)?.current_period_end
                    const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000) : null

                    // find user by stripe customer id or client_reference_id
                    let user = null
                    if (session.client_reference_id) {
                        user = await prisma.user.findUnique({ where: { id: session.client_reference_id } })
                    }
                    if (!user && typeof customer === 'string') {
                        user = await prisma.user.findFirst({ where: { stripeCustomerId: customer } })
                    }

                    if (user) {
                        // Resolve our DB product from the Stripe product ID
                        const dbProduct = product ? await prisma.product.findFirst({ where: { stripeProductId: product } }) : null
                        const resolvedProductId = dbProduct?.id || product || 'unknown'

                        // upsert subscription
                        await upsertSubscriptionRecord({
                            userId: user.id,
                            productId: resolvedProductId,
                            stripeSubscriptionId: subId,
                            status: stripeSub.status,
                            currentPeriodEnd,
                            metadata: stripeSub.metadata || {},
                        })
                        // ensure user's stripeCustomerId is set
                        if (!user.stripeCustomerId && typeof customer === 'string') {
                            await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer } })
                        }

                        const planName = dbProduct?.name || 'Unknown Plan'
                        const interval = stripeSub.items.data[0]?.price?.recurring?.interval === 'year' ? 'year' : 'month'
                        const amountCents = stripeSub.items.data[0]?.price?.unit_amount || 0

                        // Emit billing event - admin Discord notification is handled by event system
                        await events.emit('billing.subscription-created', {
                            userId: user.id,
                            email: user.email || '',
                            subscriptionId: subId,
                            planId: product || 'unknown',
                            planName,
                            interval: interval as 'month' | 'year',
                            amount: amountCents / 100,
                            currency: stripeSub.currency || 'usd',
                        })

                        // Auto-provision Vultr Object Storage bucket for storage-bucket subscriptions
                        const sessionMetadata = session.metadata || {}
                        if (sessionMetadata.type === 'storage-bucket' && sessionMetadata.location) {
                            await provisionUserStorageBucket(
                                user,
                                sessionMetadata.location as string,
                                subId,
                                sessionMetadata.tier as string | undefined,
                            ).catch((err) => {
                                // Non-fatal: log and let the admin handle it manually
                                logger.error(`[Webhook] Failed to provision storage bucket for user ${user.id}`, err)
                            })
                        }

                        const creditsApplied = sessionMetadata.creditsAppliedCents
                            ? parseInt(sessionMetadata.creditsAppliedCents as string)
                            : 0
                        if (creditsApplied > 0) {
                            await settleAppliedCredits(
                                user.id,
                                creditsApplied,
                                subId,
                                `Applied $${creditsApplied / 100} credit to subscription checkout`,
                                { subscriptionId: subId, checkoutSessionId: session.id }
                            )
                        }

                        logger.info(`[Webhook] Subscription created for user ${user.id}: ${subId}`)
                    }
                } else {
                    // one-off payment via checkout.session (mode=payment)
                    const customer = session.customer
                    const metadata = session.metadata || {}
                    let user = null
                    if (metadata?.userId) user = await prisma.user.findUnique({ where: { id: metadata.userId } })
                    if (!user && typeof customer === 'string') {
                        user = await prisma.user.findFirst({ where: { stripeCustomerId: customer } })
                    }
                    if (user) {
                        const purchaseType = metadata?.type || 'one_off'
                        const qty = metadata?.quantity ? parseInt(metadata.quantity) : 1
                        const paymentIntentId = typeof session.payment_intent === 'string'
                            ? session.payment_intent
                            : undefined

                        if (paymentIntentId) {
                            await prisma.oneOffPurchase.upsert({
                                where: { stripePaymentIntentId: paymentIntentId },
                                update: {
                                    userId: user.id,
                                    type: purchaseType,
                                    quantity: qty,
                                    amountCents: session.amount_total || 0,
                                    metadata: metadata || {},
                                },
                                create: {
                                    userId: user.id,
                                    type: purchaseType,
                                    quantity: qty,
                                    amountCents: session.amount_total || 0,
                                    stripePaymentIntentId: paymentIntentId,
                                    metadata: metadata || {},
                                },
                            })
                        } else {
                            const existingPurchase = await prisma.oneOffPurchase.findFirst({
                                where: {
                                    userId: user.id,
                                    type: purchaseType,
                                    createdAt: {
                                        gte: new Date(Date.now() - 1000 * 60 * 10),
                                    },
                                    metadata: {
                                        path: ['checkoutSessionId'],
                                        equals: session.id,
                                    },
                                },
                                select: { id: true },
                            })

                            if (!existingPurchase) {
                                await prisma.oneOffPurchase.create({
                                    data: {
                                        userId: user.id,
                                        type: purchaseType,
                                        quantity: qty,
                                        amountCents: session.amount_total || 0,
                                        metadata: {
                                            ...(metadata || {}),
                                            checkoutSessionId: session.id,
                                        },
                                    },
                                })
                            }
                        }

                        // Log purchase completion and credit transaction if credits were applied
                        const creditsApplied = metadata?.creditsAppliedCents
                            ? parseInt(metadata.creditsAppliedCents)
                            : 0

                        if (creditsApplied > 0) {
                            await settleAppliedCredits(
                                user.id,
                                creditsApplied,
                                String(session.payment_intent || session.id),
                                `Applied $${creditsApplied / 100} credit to ${metadata?.type || 'purchase'}`,
                                { purchaseType: metadata?.type, quantity: metadata?.quantity, checkoutSessionId: session.id }
                            )
                            console.log(`[Webhook] Applied $${creditsApplied / 100} credit to user ${user.id} for purchase`)
                        }

                        // apply side-effects for specific one-off purchases
                        if (purchaseType === 'extra_storage') {
                            // qty is in GB; convert to MB
                            const addMB = qty * 1024
                            const current = user.storageQuotaMB ?? 0
                            await prisma.user.update({ where: { id: user.id }, data: { storageQuotaMB: current + addMB } })
                            logger.info(`[Webhook] Added ${qty}GB storage to user ${user.id}`)
                        }

                        // Domain slot purchases are tracked via OneOffPurchase records
                        // The domain limit check in quota.ts counts these records automatically
                        if (purchaseType === 'custom_domain') {
                            logger.info(`[Webhook] Added ${qty} domain slot(s) to user ${user.id}`)
                        }

                        // Emit payment event - admin Discord notification is handled by event system
                        await events.emit('billing.payment-succeeded', {
                            userId: user.id,
                            email: user.email || '',
                            paymentId: session.payment_intent || session.id,
                            amount: (session.amount_total || 0) / 100,
                            currency: session.currency || 'usd',
                            receiptUrl: undefined,
                        })
                    }
                }
                break
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any
                const subscriptionId = invoice.subscription
                if (subscriptionId) {
                    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price.product'] })
                    const customer = stripeSub.customer as string
                    const stripeProductId = (stripeSub.items.data[0].price.product as any)?.id || null
                    // Clover API: current_period_end moved to item level
                    const rawPeriodEnd = (stripeSub as any).current_period_end ?? (stripeSub.items.data[0] as any)?.current_period_end
                    const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000) : null

                    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customer } })
                    if (user) {
                        // Map Stripe product ID → internal DB product ID
                        const dbProduct = stripeProductId
                            ? await prisma.product.findFirst({ where: { stripeProductId } })
                            : null
                        const resolvedProductId = dbProduct?.id || stripeProductId || 'unknown'
                        // update or create subscription
                        await upsertSubscriptionRecord({
                            userId: user.id,
                            productId: resolvedProductId,
                            stripeSubscriptionId: subscriptionId,
                            status: stripeSub.status,
                            currentPeriodEnd,
                            metadata: stripeSub.metadata || {},
                        })

                        // Log invoice payment
                        const amountPaid = invoice.amount_paid || 0

                        // Emit billing event
                        await events.emit('billing.payment-succeeded', {
                            userId: user.id,
                            email: user.email || '',
                            paymentId: invoice.payment_intent || invoice.id,
                            amount: amountPaid / 100,
                            currency: invoice.currency || 'usd',
                            invoiceId: invoice.id,
                            receiptUrl: invoice.hosted_invoice_url || undefined,
                        })

                        logger.info(`[Webhook] Invoice paid for user ${user.id}: $${amountPaid / 100}`)
                    }
                }
                break
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object as any
                const subscriptionId = invoice.subscription
                if (subscriptionId) {
                    await prisma.subscription.updateMany({ where: { stripeSubscriptionId: subscriptionId }, data: { status: 'past_due' } })

                    // Find user to emit failure event
                    const failedSub = await prisma.subscription.findFirst({
                        where: { stripeSubscriptionId: subscriptionId },
                        include: { user: { select: { id: true, email: true } } },
                    })

                    if (failedSub?.user) {
                        await events.emit('billing.payment-failed', {
                            userId: failedSub.user.id,
                            email: failedSub.user.email || '',
                            amount: (invoice.amount_due || 0) / 100,
                            currency: invoice.currency || 'usd',
                            failureReason: invoice.last_finalization_error?.message || 'Payment failed',
                            nextRetryAt: invoice.next_payment_attempt
                                ? new Date(invoice.next_payment_attempt * 1000)
                                : undefined,
                        })
                    }

                    logger.warn(`[Webhook] Payment failed for subscription ${subscriptionId}`)
                }
                break
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object as any
                const stripeSubId = subscription.id as string
                const customerId = subscription.customer as string

                const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
                if (user) {
                    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId, {
                        expand: ['items.data.price.product'],
                    })
                    const stripeProductId = (stripeSub.items.data[0]?.price?.product as any)?.id || null
                    const mappedProduct = stripeProductId
                        ? await prisma.product.findFirst({ where: { stripeProductId } })
                        : null

                    // Clover API: current_period_end moved to item level
                    const rawPeriodEnd = (stripeSub as any).current_period_end ?? (stripeSub.items.data[0] as any)?.current_period_end
                    const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000) : null

                    const existing = await prisma.subscription.findFirst({
                        where: { stripeSubscriptionId: stripeSubId },
                    })

                    // Prefer the freshly mapped DB product; fall back to existing record
                    const resolvedProductId = mappedProduct?.id || existing?.productId
                    if (!resolvedProductId) {
                        logger.warn(`[Webhook] Unable to map product for subscription ${stripeSubId}`)
                        break
                    }

                    await upsertSubscriptionRecord({
                        userId: user.id,
                        productId: resolvedProductId,
                        stripeSubscriptionId: stripeSubId,
                        status: stripeSub.status,
                        currentPeriodEnd,
                        cancelAtPeriodEnd: Boolean(stripeSub.cancel_at_period_end),
                        metadata: stripeSub.metadata || {},
                    })

                    const newPlanId = resolvedProductId
                    await events.emit('billing.subscription-updated', {
                        userId: user.id,
                        email: user.email || '',
                        subscriptionId: stripeSubId,
                        oldPlanId: existing?.productId,
                        newPlanId,
                        newPlanName: newPlanId,
                        changeType: 'interval-change',
                    })
                }

                break
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any
                const stripeSubId = subscription.id as string

                const existing = await prisma.subscription.findFirst({
                    where: { stripeSubscriptionId: stripeSubId },
                    include: {
                        user: { select: { id: true, email: true } },
                    },
                })

                if (existing) {
                    // Clover API: current_period_end moved to item level
                    const rawDeletedPeriodEnd = (subscription as any).current_period_end
                        ?? (subscription.items?.data[0] as any)?.current_period_end
                    await prisma.subscription.update({
                        where: { id: existing.id },
                        data: {
                            status: 'cancelled',
                            cancelAtPeriodEnd: false,
                            currentPeriodEnd: rawDeletedPeriodEnd
                                ? new Date(rawDeletedPeriodEnd * 1000)
                                : existing.currentPeriodEnd,
                        },
                    })

                    await events.emit('billing.subscription-cancelled', {
                        userId: existing.user.id,
                        email: existing.user.email || '',
                        subscriptionId: stripeSubId,
                        planId: existing.productId,
                        cancelledBy: 'system',
                        reason: 'Subscription deleted in Stripe',
                        effectiveAt: new Date(),
                    })

                    // Deprovision Vultr bucket if this was a storage-bucket subscription
                    await deprovisionUserStorageBucket(stripeSubId, existing.user).catch((err) => {
                        logger.error(`[Webhook] Failed to deprovision storage bucket for sub ${stripeSubId}`, err)
                    })
                }

                break
            }
            case 'charge.failed': {
                const charge = event.data.object as Stripe.Charge
                const customerId = typeof charge.customer === 'string' ? charge.customer : null
                if (customerId) {
                    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
                    if (user) {
                        auditPaymentFailed(
                            user.id,
                            user.email || '',
                            (charge.amount || 0) / 100,
                            charge.currency,
                            charge.failure_message || 'Charge failed',
                            charge.id
                        )
                    }
                }
                logger.warn(`[Webhook] Charge failed: ${charge.id}`)
                break
            }
            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge
                const customerId = typeof charge.customer === 'string' ? charge.customer : null
                if (customerId) {
                    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
                    const refund = charge.refunds?.data[0]
                    if (user && refund) {
                        auditRefundIssued(
                            user.id,
                            user.email || '',
                            refund.id,
                            charge.id,
                            refund.amount / 100,
                            refund.currency,
                            refund.reason ?? undefined
                        )
                    }
                }
                logger.info(`[Webhook] Charge refunded: ${charge.id}`)
                break
            }
            default:
                break
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        logger.error('[Webhook] Verification or processing error', err instanceof Error ? err : new Error(String(err)))
        return NextResponse.json({ error: 'webhook verification failed' }, { status: 400 })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage bucket provisioning helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Provisions a Vultr Object Storage bucket for a user after they subscribe.
 * Finds the admin-provisioned VultrObjectStorage pool for the chosen region,
 * creates a per-user bucket inside it, saves a StorageBucket record, and
 * assigns it to the user.
 */
async function provisionUserStorageBucket(
    user: { id: string; email: string | null; name: string | null },
    region: string,
    stripeSubscriptionId: string,
    tierSlug?: string,
): Promise<void> {
    const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            storageBucketId: true,
        },
    })

    if (existingUser?.storageBucketId) {
        const assignedBucket = await prisma.storageBucket.findUnique({
            where: { id: existingUser.storageBucketId },
            select: { id: true, stripeSubscriptionId: true, provisionStatus: true },
        })

        if (assignedBucket) {
            await prisma.storageBucket.update({
                where: { id: assignedBucket.id },
                data: {
                    stripeSubscriptionId,
                    provisionStatus: 'active',
                },
            })
            logger.info(`[Provision] User ${user.id} already has bucket ${existingUser.storageBucketId}; kept assignment in place`)
            return
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { storageBucketId: null },
        })
        logger.warn(`[Provision] Cleared stale bucket assignment ${existingUser.storageBucketId} for user ${user.id}`)
    }

    // Find an active Vultr instance pool for this region, preferring one whose
    // tier matches the product the user purchased (e.g. 'standard', 'archival').
    // Falls back to any active instance in the region for backwards compatibility.
    const tierWord = tierSlug ?? null  // e.g. 'standard', 'archival', or null

    let vultrInstance = tierWord
        ? await prisma.vultrObjectStorage.findFirst({
              where: { region, status: 'active', tier: { contains: tierWord, mode: 'insensitive' } },
              orderBy: { createdAt: 'asc' },
          })
        : null

    if (!vultrInstance) {
        vultrInstance = await prisma.vultrObjectStorage.findFirst({
            where: { region, status: 'active' },
            orderBy: { createdAt: 'asc' },
        })
    }

    if (!vultrInstance) {
        logger.error(`[Provision] No active Vultr Object Storage pool for region '${region}'. ` +
            `Admin must provision one at Admin → Storage → Vultr before users can purchase in this region.`)
        return
    }

    // Bucket name: lowercase, DNS-safe, unique per user
    const bucketName = `emberly-${user.id.slice(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '')}`

    const existingBucket = await prisma.storageBucket.findFirst({
        where: {
            OR: [
                { stripeSubscriptionId },
                { vultrBucketName: bucketName },
                { s3Bucket: bucketName },
            ],
        },
        select: { id: true },
    })

    if (existingBucket) {
        await prisma.$transaction([
            prisma.storageBucket.update({
                where: { id: existingBucket.id },
                data: {
                    stripeSubscriptionId,
                    vultrObjectStorageId: vultrInstance.id,
                    provisionStatus: 'active',
                },
            }),
            prisma.user.update({
                where: { id: user.id },
                data: { storageBucketId: existingBucket.id },
            }),
        ])
        logger.info(`[Provision] Reused existing bucket ${existingBucket.id} for user ${user.id}`)
        return
    }

    // Create the bucket inside the shared Vultr instance
    try {
        await createObjectStorageBucket(vultrInstance.vultrId, bucketName)
        logger.info(`[Provision] Created Vultr bucket '${bucketName}' in instance ${vultrInstance.vultrId}`)
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (!message.toLowerCase().includes('already exists')) {
            throw err
        }
        logger.warn(`[Provision] Vultr bucket '${bucketName}' already exists; continuing with DB assignment`)
    }

    // Persist the StorageBucket record and assign it to the user atomically
    const storageBucket = await prisma.$transaction(async (tx) => {
        const foundBucket = await tx.storageBucket.findFirst({
            where: {
                OR: [
                    { stripeSubscriptionId },
                    { vultrBucketName: bucketName },
                    { s3Bucket: bucketName },
                ],
            },
        })

        const storageBucket = foundBucket
            ? await tx.storageBucket.update({
                where: { id: foundBucket.id },
                data: {
                    name: `${user.name || user.email || user.id}'s Bucket (${region.toUpperCase()})`,
                    provider: 's3',
                    s3Bucket: bucketName,
                    s3Region: vultrInstance.region,
                    s3AccessKeyId: vultrInstance.s3AccessKey,
                    s3SecretKey: vultrInstance.s3SecretKey,
                    s3Endpoint: `https://${vultrInstance.s3Hostname}`,
                    s3ForcePathStyle: false,
                    vultrObjectStorageId: vultrInstance.id,
                    vultrBucketName: bucketName,
                    stripeSubscriptionId,
                    provisionStatus: 'active',
                },
            })
            : await tx.storageBucket.create({
            data: {
                name: `${user.name || user.email || user.id}'s Bucket (${region.toUpperCase()})`,
                provider: 's3',
                s3Bucket: bucketName,
                s3Region: vultrInstance.region,
                s3AccessKeyId: vultrInstance.s3AccessKey,
                s3SecretKey: vultrInstance.s3SecretKey,
                s3Endpoint: `https://${vultrInstance.s3Hostname}`,
                s3ForcePathStyle: false,
                vultrObjectStorageId: vultrInstance.id,
                vultrBucketName: bucketName,
                stripeSubscriptionId,
                provisionStatus: 'active',
            },
            })

        await tx.user.update({
            where: { id: user.id },
            data: { storageBucketId: storageBucket.id },
        })

        return storageBucket
    })

    await events.emit('user.bucket-provisioned', {
        userId: user.id,
        email: user.email || '',
        region,
        bucketName,
        s3Hostname: vultrInstance.s3Hostname,
        storageBucketId: storageBucket.id,
    })

    logger.info(`[Provision] Bucket provisioned and assigned to user ${user.id}`)
}

/**
 * Deprovisions the Vultr bucket tied to a cancelled Stripe subscription.
 * Deletes the bucket from Vultr, removes the StorageBucket record and
 * clears the user assignment.
 */
async function deprovisionUserStorageBucket(
    stripeSubscriptionId: string,
    user: { id: string; email: string | null },
): Promise<void> {
    const storageBucket = await prisma.storageBucket.findFirst({
        where: { stripeSubscriptionId },
        include: { vultrObjectStorage: true },
    })

    if (!storageBucket) return  // Not a Vultr-backed bucket subscription

    const { vultrObjectStorage, vultrBucketName } = storageBucket

    // Delete the bucket from Vultr if we can identify it
    if (vultrObjectStorage && vultrBucketName) {
        try {
            await deleteObjectStorageBucket(vultrObjectStorage.vultrId, vultrBucketName)
            logger.info(`[Deprovision] Deleted Vultr bucket '${vultrBucketName}' from instance ${vultrObjectStorage.vultrId}`)
        } catch (err) {
            logger.error(`[Deprovision] Failed to delete Vultr bucket '${vultrBucketName}'`, err as Error)
            // Continue — still clean up the DB record
        }
    }

    // Clear user assignment and remove StorageBucket record
    await prisma.$transaction([
        prisma.user.updateMany({
            where: { storageBucketId: storageBucket.id },
            data: { storageBucketId: null },
        }),
        prisma.storageBucket.delete({ where: { id: storageBucket.id } }),
    ])

    await events.emit('user.bucket-deprovisioned', {
        userId: user.id,
        email: user.email || '',
        region: storageBucket.s3Region,
        bucketName: vultrBucketName ?? '',
        reason: 'Subscription cancelled',
    })

    logger.info(`[Deprovision] Bucket deprovisioned for user ${user.id}`)
}
