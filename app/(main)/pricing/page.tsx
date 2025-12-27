import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import CurrentPlan from '@/packages/components/pricing/CurrentPlan'
import CustomPricingCTA from '@/packages/components/pricing/CustomPricingCTA'
import PricingHero from '@/packages/components/pricing/PricingHero'
import PageShell from '@/packages/components/layout/PageShell'
import PricingTabs from '@/packages/components/pricing/PricingTabs'
import { getAddOnPricing, getPlanPricing } from '@/packages/lib/products/pricing'

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  const activeProducts = await prisma.product.findMany({ where: { active: true } })

  let user: any = null
  if (session?.user?.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        subscriptions: { select: { id: true, productId: true, status: true }, take: 1, orderBy: { createdAt: 'desc' } },
      },
    })
  }

  const activeSubscription = user?.subscriptions?.[0] ?? null

  // interactive add-on controls handled in client component `AddOnCheckout`

  const planProducts = activeProducts.filter((p) => p.type === 'plan' || !p.type)

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
      features: product.features && product.features.length ? product.features : ['Everything you need to get started.'],
      priceIdMonthly: pricing.priceIdMonthly,
      priceIdYearly: pricing.priceIdYearly,
      popular: Boolean(product.popular),
    }
  })

  const sparkSlug = planProducts.find((p) => p.slug === 'spark')?.slug
  const activePlanKey = activeSubscription
    ? (planProducts.find((p) => p.id === activeSubscription.productId)?.slug || planProducts.find((p) => p.id === activeSubscription.productId)?.id || sparkSlug || 'free')
    : (sparkSlug || 'free')

  const currentPlanName = activeSubscription
    ? planProducts.find((p) => p.id === activeSubscription.productId)?.name || 'Current plan'
    : planProducts.find((p) => p.slug === 'spark')?.name || 'Current plan'

  const addOnProducts = activeProducts.filter((p) => p.type === 'addon')

  const addOns = addOnProducts.map((product) => {
    const pricing = getAddOnPricing(product)
    return {
      key: product.slug || product.id,
      name: product.name,
      description: product.description || 'Optional add-on.',
      priceId: pricing.priceId || '',
      billingPeriod: pricing.billingPeriod,
      pricePerUnit: pricing.pricePerUnit,
      features: product.features || [],
    }
  })

  return (
    <PageShell bodyVariant="plain">
      <section className="max-w-5xl mx-auto px-4 py-16">
        <PricingHero />

        {activeSubscription && (
          <div className="mt-6">
            <CurrentPlan productId={activeSubscription.productId} productName={currentPlanName} status={activeSubscription.status} />
          </div>
        )}

        <PricingTabs
          plans={plans}
          activePlanKey={activePlanKey}
          addOns={addOns}
        />

        <CustomPricingCTA />
      </section>
    </PageShell>
  )
}
