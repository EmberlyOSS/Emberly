import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { createCheckoutSession } from '@/packages/lib/stripe/billing'
import { handleApiError } from '@/packages/lib/api/error-handler'

// POST /api/payments/purchase
// body: { type: 'extra_storage'|'custom_domain', quantity?: number, priceId: string }
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { priceId, type, quantity } = body
        if (!process.env.STRIPE_SECRET && !process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const checkout = await createCheckoutSession({
            userId: user.id,
            email: user.email,
            priceId,
            successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard`,
            cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pricing`,
            mode: 'payment',
            quantity: quantity || 1,
            metadata: { type: type || 'one_off', quantity: String(quantity || 1) },
            applyCredits: true,
        })

        return NextResponse.json({ url: checkout.url })
    } catch (err) {
        return handleApiError(err, 'Purchase session creation failed')
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
        return handleApiError(err, 'Purchase GET failed')
    }
}
