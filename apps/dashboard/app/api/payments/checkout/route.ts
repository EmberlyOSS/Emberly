import { appUrl } from '@/lib/config/env'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@emberly/db'
import { createCheckoutSession } from '@/lib/stripe/billing'
import { isStripeConfigured } from '@/lib/stripe/client'
import { isBillingEnabled } from '@/lib/features'
import { handleApiError } from '@/lib/api/error-handler'

// Create Checkout session for subscription
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { priceId, successUrl, cancelUrl, metadata } = body

    if (!(await isBillingEnabled())) {
      return NextResponse.json(
        { error: 'Payments are currently disabled' },
        { status: 403 }
      )
    }

    if (!(await isStripeConfigured())) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 501 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Only allow a flat string-to-string metadata object from client
    const safeMetadata: Record<string, string> = {}
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      for (const [k, v] of Object.entries(metadata)) {
        if (typeof k === 'string' && typeof v === 'string') {
          safeMetadata[k] = v
        }
      }
    }

    const checkout = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      priceId,
      successUrl:
        successUrl || `${appUrl()}/dashboard`,
      cancelUrl:
        cancelUrl || `${appUrl()}/pricing`,
      metadata: safeMetadata,
      applyCredits: true,
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    return handleApiError(err, 'Checkout session creation failed', {
      details: true,
    })
  }
}

// Support GET for quick links: /api/payments/checkout?priceId=price_xxx
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const priceId = url.searchParams.get('priceId')
    if (!priceId)
      return NextResponse.json({ error: 'priceId required' }, { status: 400 })

    const r = await POST(
      new Request(req.url, {
        method: 'POST',
        body: JSON.stringify({ priceId }),
      })
    )
    return r
  } catch (err) {
    return handleApiError(err, 'Checkout GET failed')
  }
}
