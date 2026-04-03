import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { getStripeClient } from '@/packages/lib/stripe/client'

/**
 * GET /api/profile/billing-history
 * Returns credit transaction history for the authenticated user
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(req.url)
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200) // Max 200
        const offset = parseInt(url.searchParams.get('offset') || '0')

        // Safely get credit transactions - handle case where model might not be available
        let transactions: any[] = []
        try {
            if ((prisma as any).creditTransaction) {
                transactions = await (prisma as any).creditTransaction.findMany({
                    where: { userId: session.user.id },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: offset,
                    select: {
                        id: true,
                        type: true,
                        amountCents: true,
                        description: true,
                        createdAt: true,
                        relatedUser: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                })
            }
        } catch (error) {
            console.error('[Billing History] Failed to fetch credit transactions:', error)
            // Continue with empty transactions array if query fails
        }

        // Also get total balance information
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                referralCredits: true,
                stripeCustomerId: true,
            },
        })

        // Get Stripe balance, payment methods, and active subscriptions
        let stripeBalance = 0
        let paymentMethods: any[] = []
        let stripeSubscriptions: any[] = []
        if (user?.stripeCustomerId) {
            try {
                if (process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY) {
                    const stripe = getStripeClient()
                    const [customer, subs] = await Promise.all([
                        stripe.customers.retrieve(user.stripeCustomerId),
                        stripe.subscriptions.list({ customer: user.stripeCustomerId, status: 'all', limit: 10, expand: ['data.items.data.price'] }),
                    ])
                    // Stripe stores credit as a negative balance (e.g. -1000 = $10 credit)
                    stripeBalance = -((customer as any).balance || 0) / 100

                    const defaultPmId = (customer as any).invoice_settings?.default_payment_method

                    // Fetch all payment method types (card, link, etc.) via the customer endpoint
                    // This avoids missing Link-attached cards which don't appear under type:'card'
                    const allPms = await stripe.customers.listPaymentMethods(user.stripeCustomerId, { limit: 20 })
                    paymentMethods = allPms.data.map((pm: any) => ({
                        id: pm.id,
                        brand: pm.card?.brand ?? pm.type,
                        last4: pm.card?.last4 ?? null,
                        expMonth: pm.card?.exp_month ?? null,
                        expYear: pm.card?.exp_year ?? null,
                        isDefault: defaultPmId === pm.id,
                    }))

                    // Resolve product names from our DB (avoids the 5-level expand limit)
                    const stripeProductIds = [...new Set(
                        subs.data.flatMap(sub =>
                            sub.items.data.map(item => item.price?.product as string).filter(Boolean)
                        )
                    )]
                    const dbProducts = stripeProductIds.length > 0
                        ? await prisma.product.findMany({ where: { stripeProductId: { in: stripeProductIds } }, select: { stripeProductId: true, name: true } })
                        : []
                    const productNameMap = Object.fromEntries(dbProducts.map(p => [p.stripeProductId!, p.name]))

                    stripeSubscriptions = subs.data.map((sub) => {
                        const firstItem = sub.items.data[0]
                        const price = firstItem?.price
                        const stripeProductId = price?.product as string
                        // In Stripe Clover API, current_period_end moved to the subscription item
                        const periodEnd = (sub as any).current_period_end ?? (firstItem as any)?.current_period_end
                        return {
                            id: sub.id,
                            status: sub.status,
                            cancelAtPeriodEnd: sub.cancel_at_period_end,
                            currentPeriodEnd: periodEnd
                                ? new Date(periodEnd * 1000).toISOString()
                                : null,
                            interval: price?.recurring?.interval,
                            amount: (price?.unit_amount ?? 0) / 100,
                            currency: price?.currency?.toUpperCase(),
                            productName: productNameMap[stripeProductId] || 'Unknown',
                        }
                    })
                }
            } catch (error) {
                console.error('[Billing History] Failed to fetch Stripe data:', error)
            }
        }

        // Convert cents to dollars for response
        const formattedTransactions = transactions.map((tx: any) => ({
            ...tx,
            amountDollars: tx.amountCents / 100,
        }))

        return NextResponse.json({
            transactions: formattedTransactions,
            pendingCredits: user?.referralCredits || 0,
            stripeBalance,
            totalBalance: (user?.referralCredits || 0) + stripeBalance,
            paymentMethods,
            stripeSubscriptions,
        })
    } catch (err) {
        console.error('billing history error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
