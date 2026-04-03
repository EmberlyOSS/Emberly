import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { createPortalSession } from '@/packages/lib/stripe/billing'
import { handleApiError } from '@/packages/lib/api/error-handler'

// GET /api/payments/portal
export async function GET(req: Request) {
    try {
        const sess = await getServerSession(authOptions)
        if (!sess?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        if (!process.env.STRIPE_SECRET && !process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
        }

        const portal = await createPortalSession({
            userId: sess.user.id,
            returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard`,
        })

        return NextResponse.redirect(portal.url)
    } catch (err) {
        return handleApiError(err, 'Portal session creation failed')
    }
}
