import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { prisma } from '@/packages/lib/database/prisma'
import { auditPaymentFailed, auditRefundIssued } from '@/packages/lib/events/audit-helper'
import { events } from '@/packages/lib/events'
import { loggers } from '@/packages/lib/logger'
import { upsertSubscriptionRecord } from '@/packages/lib/stripe/billing'
import { getStripeClient } from '@/packages/lib/stripe/client'

const logger = loggers.api

export async function POST(req: Request) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK

    if ((!process.env.STRIPE_SECRET && !process.env.STRIPE_SECRET_KEY) || !webhookSecret) {
        logger.warn('Stripe secret or webhook secret not configured')
        return NextResponse.json({ ok: true })
    }

    const buf = await req.arrayBuffer()
    const raw = Buffer.from(buf)

    try {
        const stripe = getStripeClient()
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
                        const purchase = await prisma.oneOffPurchase.create({
                            data: {
                                userId: user.id,
                                type: metadata?.type || 'one_off',
                                quantity: metadata?.quantity ? parseInt(metadata.quantity) : 1,
                                amountCents: session.amount_total || 0,
                                stripePaymentIntentId: session.payment_intent || undefined,
                                metadata: metadata || {},
                            },
                        })

                        // Log purchase completion and credit transaction if credits were applied
                        const amountPaid = session.amount_total || 0
                        const originalAmount = metadata?.originalAmountCents ? parseInt(metadata.originalAmountCents) : amountPaid
                        const creditsApplied = originalAmount - amountPaid

                        if (creditsApplied > 0) {
                            await prisma.creditTransaction.create({
                                data: {
                                    userId: user.id,
                                    type: 'applied_purchase',
                                    amountCents: -creditsApplied, // Negative = credits spent
                                    description: `Applied $${creditsApplied / 100} credit to ${metadata?.type || 'purchase'}`,
                                    relatedOrderId: session.payment_intent || session.id,
                                    metadata: { purchaseType: metadata?.type, quantity: metadata?.quantity },
                                },
                            })
                            console.log(`[Webhook] Applied $${creditsApplied / 100} credit to user ${user.id} for purchase`)
                        }

                        // apply side-effects for specific one-off purchases
                        const purchaseType = metadata?.type || 'one_off'
                        const qty = metadata?.quantity ? parseInt(metadata.quantity) : 1

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
