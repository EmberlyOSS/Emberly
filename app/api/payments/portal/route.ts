import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { ensureStripeCustomer } from '@/packages/lib/stripe/credits'

// GET /api/payments/portal
export async function GET(req: Request) {
    try {
        const sess = await getServerSession(authOptions)
        if (!sess?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await prisma.user.findUnique({ where: { id: sess.user.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const stripeSecret = process.env.STRIPE_SECRET
        if (!stripeSecret) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
        }

        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(stripeSecret, { apiVersion: '2025-11-17.clover' as any })

        // Ensure valid Stripe customer (creates if needed, validates if exists)
        const stripeCustomerId = await ensureStripeCustomer(user.id, user.email, stripe)
        if (!stripeCustomerId) {
            return NextResponse.json({ error: 'Failed to create Stripe customer' }, { status: 500 })
        }

        const portal = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard`,
        })

        return NextResponse.redirect(portal.url || '/')
    } catch (err) {
        console.error('portal error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
