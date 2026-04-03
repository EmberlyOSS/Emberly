import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { syncUserSubscriptionsFromStripe } from '@/packages/lib/stripe/billing'

/**
 * POST /api/payments/sync-subscription
 * Re-syncs the authenticated user's active Stripe subscriptions into the DB.
 * Useful if the original checkout webhook was missed or not yet configured.
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, stripeCustomerId: true },
    })

    if (!user?.stripeCustomerId) {
        return NextResponse.json({ synced: 0, message: 'No Stripe customer linked' })
    }

    if (!process.env.STRIPE_SECRET && !process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    await syncUserSubscriptionsFromStripe(user.id, user.stripeCustomerId)

    // Count what's now in DB
    const count = await prisma.subscription.count({
        where: { userId: user.id, status: 'active' },
    })

    return NextResponse.json({ synced: true, activeSubscriptions: count })
}
