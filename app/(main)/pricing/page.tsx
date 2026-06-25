import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import CurrentPlan from '@/packages/components/pricing/CurrentPlan'
import CustomPricingCTA from '@/packages/components/pricing/CustomPricingCTA'
import PricingHero from '@/packages/components/pricing/PricingHero'
import HomeShell from '@/packages/components/layout/home-shell'
import PricingTabs from '@/packages/components/pricing/PricingTabs'
import {
  getAddOnPricing,
  getPlanPricing,
} from '@/packages/lib/products/pricing'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Pricing',
  description:
    'Flexible plans for individuals, teams, and self-hosted deployments. Start free or scale up with advanced features.',
})

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  const activeProducts = await prisma.product.findMany({
    where: { active: true },
  })

  let user: any = null
  if (session?.user?.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptions: {
          select: { id: true, productId: true, status: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  const activeSubscription = user?.subscriptions?.[0] ?? null

  // interactive add-on controls handled in client component `AddOnCheckout`

  const planProducts = activeProducts.filter(
    (p) => p.type === 'plan' || !p.type
  )

  const sortedPlanProducts = [...planProducts].sort((a, b) => {
    const priceA = a.defaultPriceCents ?? Number.MAX_SAFE_INTEGER
    const priceB = b.defaultPriceCents ?? Number.MAX_SAFE_INTEGER
    if (priceA === 0 && priceB !== 0) return -1
    if (priceB === 0 && priceA !== 0) return 1
    if (priceA === priceB) return 0
    return priceA - priceB
  })

  const plans = sortedPlanProducts.map((product) => {
    const pricing = getPlanPricing(product)

    return {
      id: product.id,
      key: product.slug || product.id,
      name: product.name,
      description: product.description || 'Flexible plan for your team.',
      price: pricing.monthlyDisplay,
      priceYearly: pricing.yearlyDisplay,
      features:
        product.features && product.features.length
          ? product.features
          : ['Everything you need to get started.'],
      priceIdMonthly: pricing.priceIdMonthly,
      priceIdYearly: pricing.priceIdYearly,
      popular: Boolean(product.popular),
    }
  })

  const sparkSlug = planProducts.find((p) => p.slug === 'spark')?.slug
  const activePlanKey = activeSubscription
    ? planProducts.find((p) => p.id === activeSubscription.productId)?.slug ||
      planProducts.find((p) => p.id === activeSubscription.productId)?.id ||
      sparkSlug ||
      'free'
    : sparkSlug || 'free'

  const currentPlanName = activeSubscription
    ? planProducts.find((p) => p.id === activeSubscription.productId)?.name ||
      'Current plan'
    : planProducts.find((p) => p.slug === 'spark')?.name || 'Current plan'

  const addOnProducts = activeProducts.filter((p) => p.type === 'addon')

  const addOns = addOnProducts.map((product) => {
    const pricing = getAddOnPricing(product)
    return {
      key: product.slug || product.id,
      name: product.name,
      description: product.description || 'Optional add-on.',
      priceId: pricing.priceId || '',
      billingPeriod: pricing.billingPeriod as 'monthly' | 'one-time',
      pricePerUnit: pricing.pricePerUnit,
      features: product.features || [],
    }
  })

  const discoveryPlanProducts = activeProducts.filter(
    (p) => p.type === 'nexium-plan'
  )

  const discoveryPlans = discoveryPlanProducts.map((product) => {
    const pricing = getPlanPricing(product)
    return {
      id: product.id,
      key: product.slug || product.id,
      name: product.name,
      description:
        product.description || 'Flexible Discovery plan for your squad.',
      price: pricing.monthlyDisplay,
      priceYearly: pricing.yearlyDisplay,
      features:
        product.features && product.features.length
          ? product.features
          : ['Everything your squad needs.'],
      priceIdMonthly: pricing.priceIdMonthly,
      priceIdYearly: pricing.priceIdYearly,
      popular: Boolean(product.popular),
    }
  })

  const discoveryActivePlanKey = activeSubscription
    ? discoveryPlanProducts.find((p) => p.id === activeSubscription.productId)
        ?.slug ||
      discoveryPlanProducts.find((p) => p.id === activeSubscription.productId)
        ?.id ||
      'nexium-free'
    : 'nexium-free'

  // Only expose regions where an admin has provisioned an active storage pool.
  // This prevents selling a bucket in a region we can't actually deliver.
  // Covers all providers: Vultr, Linode, OVHcloud.
  const activeStoragePools = await prisma.objectStoragePool.findMany({
    where: { status: 'active' },
    select: { region: true, s3Hostname: true, tier: true },
    orderBy: { region: 'asc' },
  })

  // Build per-tier region availability. `tier` stores the normalised slug set
  // at provision time (e.g. "standard", "premium", "high_performance").
  // Tier keyword matching is substring-based so "high_performance" → "performance".
  const tierKeywords = [
    'archival',
    'standard',
    'premium',
    'performance',
    'accelerated',
  ] as const
  const tierRegions: Record<string, string[]> = {}
  const hasTierInfo = activeStoragePools.some(
    (v) => v.tier && v.tier !== 'standard'
  )

  for (const kw of tierKeywords) {
    const slug = `storage-bucket-${kw}`
    if (hasTierInfo) {
      tierRegions[slug] = activeStoragePools
        .filter((v) => v.tier?.toLowerCase().includes(kw))
        .map((v) => v.region)
    } else {
      // Legacy: all pools provisioned before tier tracking — offer all regions for all tiers
      tierRegions[slug] = activeStoragePools.map((v) => v.region)
    }
  }

  // Build storageTiers array from the 5 tier addon products
  const storageTierSlugs = tierKeywords.map((kw) => `storage-bucket-${kw}`)
  const storageTierProducts = activeProducts.filter((p) =>
    storageTierSlugs.includes(p.slug ?? '')
  )

  const storageTiers = storageTierSlugs
    .map((slug) => {
      const product = storageTierProducts.find((p) => p.slug === slug)
      if (!product) return null
      const pricing = getAddOnPricing(product)
      return {
        slug,
        name: product.name,
        priceId: pricing.priceId || '',
        priceCents: product.defaultPriceCents ?? 0,
        availableRegions: tierRegions[slug] ?? [],
      }
    })
    .filter(
      Boolean
    ) as import('@/packages/components/pricing/S3Section').StorageTier[]

  return (
    <HomeShell>
      <div className="container space-y-8">
        <PricingHero />

        <PricingTabs
          plans={plans}
          activePlanKey={activePlanKey}
          addOns={addOns}
          discoveryPlans={discoveryPlans}
          discoveryActivePlanKey={discoveryActivePlanKey}
          storageTiers={storageTiers}
        />

        <CustomPricingCTA />
      </div>
    </HomeShell>
  )
}
