import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { getStripeClient, isStripeConfigured } from '@/packages/lib/stripe/client'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api.getChildLogger('admin-promo-codes')

const CreatePromoSchema = z.object({
  /** Human-readable code customers enter at checkout (e.g. SUMMER20) */
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, 'Code must only contain letters, numbers, hyphens, and underscores'),
  /** Discount percentage (0–100). Use this OR amountOff, not both. */
  percentOff: z.number().min(1).max(100).optional(),
  /** Fixed discount in cents. Use this OR percentOff, not both. */
  amountOff: z.number().int().min(1).optional(),
  /** ISO currency code — required if amountOff is set */
  currency: z.string().length(3).optional(),
  /** Maximum number of times this code can be redeemed (null = unlimited) */
  maxRedemptions: z.number().int().min(1).optional(),
  /** Unix timestamp when this code expires (null = never) */
  expiresAt: z.number().int().optional(),
  /** Whether to hide this code from the public pricing page */
  isPrivate: z.boolean().optional(),
})

/**
 * GET /api/admin/promo-codes
 * Returns all active Stripe promotion codes (first 100).
 */
export async function GET(req: Request) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    if (!(await isStripeConfigured())) {
      return apiError('Stripe is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE)
    }

    const stripe = await getStripeClient()

    const [promoCodes, coupons] = await Promise.all([
      stripe.promotionCodes.list({ limit: 100, expand: ['data.promotion.coupon'] }),
      stripe.coupons.list({ limit: 100 }),
    ])

    const result = promoCodes.data.map((pc) => {
      const promotion = pc.promotion as any
      const coupon = promotion?.coupon as any
      return {
        id: pc.id,
        code: pc.code,
        active: pc.active,
        couponId: coupon.id,
        couponName: coupon.name ?? null,
        percentOff: coupon.percent_off ?? null,
        amountOff: coupon.amount_off ?? null,
        currency: coupon.currency ?? null,
        timesRedeemed: pc.times_redeemed,
        maxRedemptions: pc.max_redemptions ?? null,
        expiresAt: pc.expires_at ?? null,
        createdAt: pc.created,
        isPrivate: pc.metadata?.['private'] === 'true',
      }
    })

    return apiResponse(result)
  } catch (error) {
    logger.error('Error listing promo codes', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/**
 * POST /api/admin/promo-codes
 * Creates a new Stripe coupon + promotion code.
 */
export async function POST(req: Request) {
  try {
    const { user: adminUser, response } = await requireAdmin()
    if (response) return response

    if (!(await isStripeConfigured())) {
      return apiError('Stripe is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE)
    }

    const json = await req.json().catch(() => null)
    const parsed = CreatePromoSchema.safeParse(json)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const { code, percentOff, amountOff, currency, maxRedemptions, expiresAt, isPrivate } = parsed.data

    if (!percentOff && !amountOff) {
      return apiError('Either percentOff or amountOff is required', HTTP_STATUS.BAD_REQUEST)
    }
    if (percentOff && amountOff) {
      return apiError('Only one of percentOff or amountOff may be set', HTTP_STATUS.BAD_REQUEST)
    }
    if (amountOff && !currency) {
      return apiError('currency is required when amountOff is set', HTTP_STATUS.BAD_REQUEST)
    }

    const stripe = await getStripeClient()

    // Create a coupon first, then attach a promotion code to it.
    // If promo code creation fails, delete the coupon to avoid orphans.
    const coupon = await stripe.coupons.create({
      name: code,
      ...(percentOff ? { percent_off: percentOff } : {}),
      ...(amountOff ? { amount_off: amountOff, currency: currency! } : {}),
      duration: 'once',
    })

    let promoCode: Awaited<ReturnType<typeof stripe.promotionCodes.create>>
    try {
      promoCode = await stripe.promotionCodes.create({
        promotion: { type: 'coupon', coupon: coupon.id },
        code,
        ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
        ...(expiresAt ? { expires_at: expiresAt } : {}),
        ...(isPrivate ? { metadata: { private: 'true' } } : {}),
      })
    } catch (promoErr: any) {
      // Roll back the coupon so we don't leave orphans in Stripe
      await stripe.coupons.del(coupon.id).catch(() => {})
      throw promoErr
    }

    logger.info('Promo code created', {
      adminId: adminUser.id,
      promoCodeId: promoCode.id,
      code,
    })

    return apiResponse({
      id: promoCode.id,
      code: promoCode.code,
      couponId: coupon.id,
      percentOff: coupon.percent_off ?? null,
      amountOff: coupon.amount_off ?? null,
      currency: coupon.currency ?? null,
      maxRedemptions: promoCode.max_redemptions ?? null,
      expiresAt: promoCode.expires_at ?? null,
    })
  } catch (error: any) {
    if (error?.type === 'StripeInvalidRequestError') {
      return apiError(error.message, HTTP_STATUS.BAD_REQUEST)
    }
    logger.error('Error creating promo code', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
