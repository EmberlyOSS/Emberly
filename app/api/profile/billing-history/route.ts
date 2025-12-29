import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'

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

        // Get Stripe balance if customer exists
        let stripeBalance = 0
        if (user?.stripeCustomerId) {
            try {
                const Stripe = (await import('stripe')).default
                const stripeSecret = process.env.STRIPE_SECRET
                if (stripeSecret) {
                    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-11-17.clover' as any })
                    const customer = await stripe.customers.retrieve(user.stripeCustomerId)
                    stripeBalance = ((customer as any).balance || 0) / 100 // Convert cents to dollars
                }
            } catch (error) {
                console.error('[Billing History] Failed to fetch Stripe balance:', error)
            }
        }

        // Convert cents to dollars for response
        const formattedTransactions = transactions.map((tx: any) => ({
            ...tx,
            amountDollars: tx.amountCents / 100,
        }))

        return NextResponse.json({
            transactions: formattedTransactions,
            pendingCredits: user?.referralCredits || 0, // Awaiting conversion to Stripe
            stripeBalance: stripeBalance, // Current available credit in Stripe
            totalBalance: (user?.referralCredits || 0) + stripeBalance, // Total available credit
        })
    } catch (err) {
        console.error('billing history error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
