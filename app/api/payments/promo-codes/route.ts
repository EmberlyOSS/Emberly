import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { getStripeClient, isStripeConfigured } from '@/packages/lib/stripe/client'

/**
 * GET /api/payments/promo-codes
 * Returns publicly visible active promotion codes for display on the pricing page.
 * Only exposes safe fields — no redemption counts or internal coupon IDs.
 */
export async function GET() {
  try {
    if (!(await isStripeConfigured())) {
      return apiResponse([])
    }

    const stripe = await getStripeClient()

    const promoCodes = await stripe.promotionCodes.list({
      active: true,
      limit: 100,
      expand: ['data.promotion.coupon'],
    })

    const result = promoCodes.data
      .filter((pc) => pc.metadata?.['private'] !== 'true')
      .map((pc) => {
      const promotion = pc.promotion as any
      const coupon = promotion?.coupon as any
      return {
        id: pc.id,
        code: pc.code,
        percentOff: coupon.percent_off ?? null,
        amountOff: coupon.amount_off ?? null,
        currency: coupon.currency ?? null,
        maxRedemptions: pc.max_redemptions ?? null,
        timesRedeemed: pc.times_redeemed,
        expiresAt: pc.expires_at ?? null,
      }
    })

    return apiResponse(result)
  } catch {
    // Fail silently — promo codes are optional display
    return apiResponse([])
  }
}
