import { Product } from '@prisma/client'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { getAddOnPricing, getPlanPricing } from '@/packages/lib/products/pricing'

const logger = loggers.api

const serializePlan = (product: Product) => {
  const pricing = getPlanPricing(product)

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    features: product.features,
    billingInterval: product.billingInterval || 'month',
    type: product.type,
    active: product.active,
    popular: product.popular,
    pricing: {
      monthlyCents: pricing.monthlyCents,
      yearlyCents: pricing.yearlyCents,
      monthly: pricing.monthlyDisplay,
      yearly: pricing.yearlyDisplay,
    },
    stripe: {
      productId: pricing.stripeProductId,
      priceIdMonthly: pricing.priceIdMonthly,
      priceIdYearly: pricing.priceIdYearly,
    },
  }
}

const serializeAddOn = (product: Product) => {
  const pricing = getAddOnPricing(product)

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    features: product.features,
    type: product.type,
    billingPeriod: pricing.billingPeriod,
    popular: product.popular,
    pricing: {
      pricePerUnitCents: pricing.pricePerUnitCents,
      pricePerUnit: pricing.pricePerUnit,
      display: pricing.display,
    },
    stripe: {
      productId: pricing.stripeProductId,
      priceIdMonthly: pricing.priceIdMonthly,
      priceIdOneTime: pricing.priceIdOneTime,
      defaultPriceId: pricing.priceId,
    },
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    })

    const plans = products.filter((p) => p.type === 'plan' || !p.type).map(serializePlan)
    const addOns = products.filter((p) => p.type === 'addon').map(serializeAddOn)

    return apiResponse({ plans, addOns })
  } catch (error) {
    logger.error('Error fetching product catalog', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
