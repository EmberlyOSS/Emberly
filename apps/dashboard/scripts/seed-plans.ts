#!/usr/bin/env bun
import { prisma } from '@emberly/db'

import { syncCatalog } from '@/lib/products/catalog'
import { isStripeConfigured } from '@/lib/stripe/client'

async function main() {
  const hasStripe = await isStripeConfigured()
  console.log(
    'Stripe:',
    hasStripe ? 'configured' : 'not configured, skipping Stripe sync'
  )

  await syncCatalog((product) => {
    const prices = [
      product.stripePriceMonthlyId,
      product.stripePriceYearlyId,
      product.stripePriceOneTimeId,
    ].filter(Boolean)
    console.log(
      `  ${product.slug}${prices.length ? ` (${prices.length} Stripe price${prices.length > 1 ? 's' : ''})` : ''}`
    )
  })

  console.log(`Done. ${await prisma.product.count()} products.`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
