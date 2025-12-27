import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'

// Create Checkout session for subscription
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { priceId, successUrl, cancelUrl } = body

        const stripeSecret = process.env.STRIPE_SECRET
        if (!stripeSecret) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(stripeSecret, { apiVersion: '2025-11-17.clover' as any }) // Force cast to fix weird type mismatch

        // ensure stripe customer (defensive: handle stale/test-mode IDs)
        let customerId = user.stripeCustomerId
        if (customerId) {
            try {
                await stripe.customers.retrieve(customerId)
            } catch (e: any) {
                console.warn('Stored Stripe customer could not be retrieved, creating new customer:', e?.message)
                const cust = await stripe.customers.create({ email: user.email || undefined, metadata: { userId: user.id } })
                customerId = cust.id
                await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
            }
        } else {
            const cust = await stripe.customers.create({
                email: user.email || undefined,
                metadata: { userId: user.id },
            })
            customerId = cust.id
            await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
        }

        const checkout = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            client_reference_id: user.id,
            metadata: { userId: user.id },
            success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard`,
            cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pricing`,
        })

        return NextResponse.json({ url: checkout.url })
    } catch (err) {
        console.error('checkout error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// Support GET for quick links: /api/payments/checkout?priceId=price_xxx
export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const priceId = url.searchParams.get('priceId')
        if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 })

        // reuse POST flow by crafting a minimal body
        const r = await POST(new Request(req.url, { method: 'POST', body: JSON.stringify({ priceId }) }))
        return r
    } catch (err) {
        console.error('checkout get error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
