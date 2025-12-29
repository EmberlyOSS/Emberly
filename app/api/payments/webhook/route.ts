import { NextResponse } from 'next/server'
import { prisma } from '@/packages/lib/database/prisma'

export async function POST(req: Request) {
    const stripeSecret = process.env.STRIPE_SECRET
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeSecret || !webhookSecret) {
        console.warn('Stripe or webhook secret not configured')
        return NextResponse.json({ ok: true })
    }

    const buf = await req.arrayBuffer()
    const raw = Buffer.from(buf)

    try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' })
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
                    const currentPeriodEnd = stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000) : null

                    // find user by stripe customer id or client_reference_id
                    let user = null
                    if (session.client_reference_id) {
                        user = await prisma.user.findUnique({ where: { id: session.client_reference_id } })
                    }
                    if (!user && typeof customer === 'string') {
                        user = await prisma.user.findFirst({ where: { stripeCustomerId: customer } })
                    }

                    if (user) {
                        // upsert subscription
                        await prisma.subscription.create({
                            data: {
                                userId: user.id,
                                productId: product || 'unknown',
                                stripeSubscriptionId: subId,
                                status: stripeSub.status,
                                currentPeriodEnd: currentPeriodEnd,
                                metadata: stripeSub.metadata || {},
                            },
                        })
                        // ensure user's stripeCustomerId is set
                        if (!user.stripeCustomerId && typeof customer === 'string') {
                            await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer } })
                        }

                        // Log subscription creation as event (not a credit transaction, just an event)
                        console.log(`[Webhook] Subscription created for user ${user.id}: ${subId}`)
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
                        if ((metadata?.type || 'one_off') === 'extra_storage') {
                            const qty = metadata?.quantity ? parseInt(metadata.quantity) : 1
                            // qty is in GB; convert to MB
                            const addMB = qty * 1024
                            const current = user.storageQuotaMB ?? 0
                            await prisma.user.update({ where: { id: user.id }, data: { storageQuotaMB: current + addMB } })
                            console.log(`[Webhook] Added ${qty}GB storage to user ${user.id}`)
                        }
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
                    const product = (stripeSub.items.data[0].price.product as any)?.id || null
                    const currentPeriodEnd = stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000) : null

                    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customer } })
                    if (user) {
                        // update or create subscription
                        await prisma.subscription.upsert({
                            where: { stripeSubscriptionId: subscriptionId },
                            create: {
                                userId: user.id,
                                productId: product || 'unknown',
                                stripeSubscriptionId: subscriptionId,
                                status: stripeSub.status,
                                currentPeriodEnd: currentPeriodEnd,
                                metadata: stripeSub.metadata || {},
                            },
                            update: {
                                status: stripeSub.status,
                                currentPeriodEnd: currentPeriodEnd,
                                metadata: stripeSub.metadata || {},
                            },
                        })

                        // Log invoice payment
                        const amountPaid = invoice.amount_paid || 0
                        console.log(`[Webhook] Invoice paid for user ${user.id}: $${amountPaid / 100}`)
                    }
                }
                break
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object as any
                const subscriptionId = invoice.subscription
                if (subscriptionId) {
                    await prisma.subscription.updateMany({ where: { stripeSubscriptionId: subscriptionId }, data: { status: 'past_due' } })
                    console.log(`[Webhook] Payment failed for subscription ${subscriptionId}`)
                }
                break
            }
            default:
                break
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        console.error('webhook error', err)
        return NextResponse.json({ error: 'webhook verification failed' }, { status: 400 })
    }
}
