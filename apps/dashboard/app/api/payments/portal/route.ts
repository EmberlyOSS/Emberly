import { appUrl } from '@/lib/config/env'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createPortalSession } from '@/lib/stripe/billing'
import { isStripeConfigured } from '@/lib/stripe/client'
import { handleApiError } from '@/lib/api/error-handler'

// GET /api/payments/portal
export async function GET(req: Request) {
    try {
        const sess = await getServerSession(authOptions)
        if (!sess?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        if (!await isStripeConfigured()) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
        }

        const portal = await createPortalSession({
            userId: sess.user.id,
            returnUrl: `${appUrl()}/dashboard`,
        })

        return NextResponse.redirect(portal.url)
    } catch (err) {
        return handleApiError(err, 'Portal session creation failed')
    }
}

