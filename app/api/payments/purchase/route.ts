import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { ensureStripeCustomer, applyReferralCreditsToStripe } from '@/packages/lib/stripe/credits'

// POST /api/payments/purchase
// body: { type: 'extra_storage'|'custom_domain', quantity?: number, priceId: string }
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { priceId, type, quantity } = body
        const stripeSecret = process.env.STRIPE_SECRET
        if (!stripeSecret) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(stripeSecret, { apiVersion: '2025-11-17.clover' as any })

        // ensure stripe customer (defensive: stored ID may be from test mode)
        const customerId = await ensureStripeCustomer(user.id, user.email, stripe)

        // Apply referral credits before creating the checkout session
        const creditsResult = await applyReferralCreditsToStripe(user.id, stripe, { relatedOrderId: priceId })
        if (creditsResult.applied) {
          console.log(`[Purchase] Applied $${creditsResult.creditAmount} in referral credits to user ${user.id}`)
        }

        const checkout = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            line_items: [{ price: priceId, quantity: quantity || 1 }],
            client_reference_id: user.id,
            metadata: { userId: user.id, type: type || 'one_off', quantity: String(quantity || 1) },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pricing`,
        })

        return NextResponse.json({ url: checkout.url })
    } catch (err) {
        console.error('purchase error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// Support GET to create purchase via query param
export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const priceId = url.searchParams.get('priceId')
        const type = url.searchParams.get('type') || 'one_off'
        if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 })

        const r = await POST(new Request(req.url, { method: 'POST', body: JSON.stringify({ priceId, type }) }))
        return r
    } catch (err) {
        console.error('purchase get error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
