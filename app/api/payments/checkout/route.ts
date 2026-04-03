import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { createCheckoutSession } from '@/packages/lib/stripe/billing'
import { handleApiError } from '@/packages/lib/api/error-handler'

// Create Checkout session for subscription
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { priceId, successUrl, cancelUrl } = body

        if (!process.env.STRIPE_SECRET && !process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const checkout = await createCheckoutSession({
            userId: user.id,
            email: user.email,
            priceId,
            successUrl: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard`,
            cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pricing`,
            applyCredits: true,
        })

        return NextResponse.json({ url: checkout.url })
    } catch (err) {
        return handleApiError(err, 'Checkout session creation failed')
    }
}

// Support GET for quick links: /api/payments/checkout?priceId=price_xxx
export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const priceId = url.searchParams.get('priceId')
        if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 })

        const r = await POST(new Request(req.url, { method: 'POST', body: JSON.stringify({ priceId }) }))
        return r
    } catch (err) {
        return handleApiError(err, 'Checkout GET failed')
    }
}
