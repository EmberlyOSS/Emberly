import { Product } from '@/prisma/generated/prisma/client'

type Cadence = 'month' | 'year' | 'one-time'

const formatCurrency = (cents: number) => (cents / 100).toLocaleString('en-US', {
  minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
})

const formatDisplay = (cents: number | null, cadence: Cadence) => {
  if (cents == null) return 'Custom pricing'
  if (cents === 0) return 'Free'
  const amount = formatCurrency(cents)
  return cadence === 'one-time' ? `$${amount} one-time` : `$${amount}/${cadence}`
}

export const getPlanPricing = (product: Product) => {
  const monthlyCents = product.billingInterval === 'year' ? null : product.defaultPriceCents ?? null

  const yearlyCents = product.billingInterval === 'year'
    ? product.defaultPriceCents ?? null
    : product.defaultPriceCents != null && product.defaultPriceCents > 0
      ? Math.round(product.defaultPriceCents * 6) // 50% off (6 months instead of 12)
      : null

  const monthlyDisplay = monthlyCents != null
    ? formatDisplay(monthlyCents, 'month')
    : yearlyCents != null
      ? formatDisplay(yearlyCents, 'year')
      : 'Custom pricing'

  const yearlyDisplay = yearlyCents != null
    ? formatDisplay(yearlyCents, 'year')
    : product.stripePriceYearlyId
      ? 'Custom pricing'
      : undefined

  return {
    monthlyCents,
    yearlyCents,
    monthlyDisplay,
    yearlyDisplay,
    priceIdMonthly: product.stripePriceMonthlyId || null,
    priceIdYearly: product.stripePriceYearlyId || null,
    stripeProductId: product.stripeProductId || null,
  }
}

export const getAddOnPricing = (product: Product) => {
  const pricePerUnitCents = product.defaultPriceCents ?? null
  const billingPeriod: 'monthly' | 'yearly' | 'one-time' =
    product.billingInterval === 'month' ? 'monthly' :
    product.billingInterval === 'year' ? 'yearly' :
    'one-time'
  const priceId = product.stripePriceMonthlyId || product.stripePriceYearlyId || product.stripePriceOneTimeId || null
  const cadence: Cadence = billingPeriod === 'monthly' ? 'month' : billingPeriod === 'yearly' ? 'year' : 'one-time'

  return {
    pricePerUnitCents,
    pricePerUnit: pricePerUnitCents != null ? pricePerUnitCents / 100 : null,
    billingPeriod,
    priceId,
    display: formatDisplay(pricePerUnitCents, cadence),
    stripeProductId: product.stripeProductId || null,
    priceIdMonthly: product.stripePriceMonthlyId || null,
    priceIdYearly: product.stripePriceYearlyId || null,
    priceIdOneTime: product.stripePriceOneTimeId || null,
  }
}

export type PlanPricing = ReturnType<typeof getPlanPricing>
export type AddOnPricing = ReturnType<typeof getAddOnPricing>
