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
    : product.stripePriceYearlyId
      ? product.defaultPriceCents != null ? product.defaultPriceCents * 12 : null
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
  const billingPeriod: 'monthly' | 'one-time' = product.billingInterval === 'month' ? 'monthly' : 'one-time'
  const priceId = product.stripePriceOneTimeId || product.stripePriceMonthlyId || null

  return {
    pricePerUnitCents,
    pricePerUnit: pricePerUnitCents != null ? pricePerUnitCents / 100 : null,
    billingPeriod,
    priceId,
    display: formatDisplay(pricePerUnitCents, billingPeriod === 'monthly' ? 'month' : 'one-time'),
    stripeProductId: product.stripeProductId || null,
    priceIdMonthly: product.stripePriceMonthlyId || null,
    priceIdOneTime: product.stripePriceOneTimeId || null,
  }
}

export type PlanPricing = ReturnType<typeof getPlanPricing>
export type AddOnPricing = ReturnType<typeof getAddOnPricing>
