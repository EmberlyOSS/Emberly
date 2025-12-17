import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'

// GET /api/payments/portal
export async function GET(req: Request) {
    try {
        const sess = await getServerSession(authOptions)
        if (!sess?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await prisma.user.findUnique({ where: { id: sess.user.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const stripeSecret = process.env.STRIPE_SECRET
        if (!stripeSecret || !user.stripeCustomerId) {
            return NextResponse.json({ error: 'Stripe or customer not configured' }, { status: 501 })
        }

        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' })

        const portal = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/account` })

        return NextResponse.redirect(portal.url || '/')
    } catch (err) {
        console.error('portal error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
