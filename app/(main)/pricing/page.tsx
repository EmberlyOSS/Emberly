import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import AddOnCheckout from '@/components/pricing/AddOnCheckout'

import { Check, Cloud, ShieldCheck, Star, Users, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import CheckoutButton from '@/components/payments/CheckoutButton'
import { Card, CardContent } from '@/components/ui/card'

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

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

  // Map Stripe product IDs (optional env overrides) to friendly plan keys
  const proProduct = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_PRO || null
  const starterProduct = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_STARTER || null

  function planKeyForProduct(productId: string | null | undefined) {
    if (!productId) return null
    if (proProduct && productId === proProduct) return 'pro'
    if (starterProduct && productId === starterProduct) return 'starter'
    const id = productId.toLowerCase()
    if (id.includes('pro')) return 'pro'
    if (id.includes('starter')) return 'starter'
    if (id.includes('free')) return 'free'
    return null
  }

  const activePlanKey = activeSubscription ? planKeyForProduct(activeSubscription.productId) : 'free'

  return (
    <main className="container mx-auto py-16">
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold">Pricing</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Flexible plans for individuals, teams, and self-hosted deployments.
            Start free or scale up with advanced features like custom domains,
            SSO, and team management.
          </p>
        </div>

        {activeSubscription && (
          <div className="mt-6">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Current plan</div>
                  <div className="font-semibold">{activeSubscription.productId}</div>
                </div>
                <div className="text-sm text-muted-foreground">{activeSubscription.status}</div>
                <div>
                  <Button asChild>
                    <a href="/api/payments/portal">Manage billing</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Free</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    For personal use
                  </p>
                </div>
                <div className="text-2xl font-extrabold">$0</div>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>10 GB storage cap</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>3 custom domains</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Basic uploads & short links</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Password protection & expirations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Community support</span>
                </li>
              </ul>

              <div className="mt-6 mt-auto">
                {activePlanKey === 'free' ? (
                  <Button disabled className="w-full">Current plan</Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/register">Create free account</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="relative border-2 border-accent">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="rounded-full bg-secondary text-white px-4 py-1 text-sm font-medium shadow-md">
                  Popular
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Pro</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    For power users
                  </p>
                </div>
                <div className="text-2xl font-extrabold">$5/month</div>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>50 GB storage cap</span>
                </li>

                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>10 custom domains</span>
                </li>

                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Advanced usage analytics</span>
                </li>

                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Priority uploads & support</span>
                </li>

                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Priority support</span>
                </li>
              </ul>

              <div className="mt-6 mt-auto">
                {activePlanKey === 'pro' ? (
                  <Button disabled className="w-full">Current plan</Button>
                ) : (
                  <CheckoutButton priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_pro_placeholder'} mode="subscription" label="Start Pro" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Starter plan */}
          <Card>
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Starter</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    For casual power users
                  </p>
                </div>
                <div className="text-2xl font-extrabold">$3/month</div>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>20 GB storage cap</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>5 custom domains</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Standard support</span>
                </li>
              </ul>

              <div className="mt-6 mt-auto">
                {activePlanKey === 'starter' ? (
                  <Button disabled className="w-full">Current plan</Button>
                ) : (
                  <CheckoutButton priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || 'price_starter_placeholder'} mode="subscription" label="Start Starter" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Open-source / Self-host card (replaces Team) */}
          <Card>
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Open-source</h3>
                  <p className="text-sm text-muted-foreground mt-1">Self-host</p>
                </div>
                <div className="text-2xl font-extrabold">Free</div>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Full source code — self-host</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Bring your own storage & domains</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Deploy anywhere with Docker / Fly / Vercel</span>
                </li>
              </ul>

              <div className="mt-6 mt-auto">
                <Button asChild variant="ghost" className="w-full">
                  <Link href="https://github.com/EmberlyOSS">View source</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Add-ons</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Buy extra storage or additional custom domains as one-off purchases.
          </p>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Extra storage</h3>
                    <p className="text-sm text-muted-foreground mt-1">Buy extra GBs of storage.</p>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold">$0.25 / GB</div>
                    <div className="text-sm text-muted-foreground">Billed as one-off</div>
                  </div>
                </div>

                <div className="mt-4 mt-auto">
                  <AddOnCheckout
                    priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_EXTRA_GB || 'price_extra_gb_placeholder'}
                    mode="payment"
                    label={`Buy storage`}
                    type="extra_storage"
                    initialQuantity={10}
                    options={[1, 2, 5, 10, 20]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Custom domain</h3>
                    <p className="text-sm text-muted-foreground mt-1">Purchase a custom domain slot.</p>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold">$1.00</div>
                    <div className="text-sm text-muted-foreground">Per domain, one-off</div>
                  </div>
                </div>

                <div className="mt-4 mt-auto">
                  <AddOnCheckout
                    priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_CUSTOM_DOMAIN || 'price_custom_domain_placeholder'}
                    mode="payment"
                    label={`Buy domain`}
                    type="custom_domain"
                    initialQuantity={1}
                    options={[1, 2, 5]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Included features</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            All plans include secure uploads, password protection, and the
            ability to export your data. Self-hosting options are available for
            teams that want full control.
          </p>

          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="flex gap-4 items-center justify-start">
                <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mt-2">Security</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Encryption in transit, optional password protection, and
                    per-file expirations.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4 items-center justify-start">
                <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">
                  <Cloud className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mt-2">Custom domains</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Bring your own domain(s) and serve content from your brand.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4 items-center justify-start">
                <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mt-2">Developer friendly</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Simple API, embeddable links, and webhooks for integrations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Frequently asked</h2>
          <div className="mt-4 grid md:grid-cols-1 gap-4">
            <details className="group bg-background/40 border border-border/50 rounded-lg p-3">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                <span>Can I self-host?</span>
                <Star className="h-4 w-4 text-muted-foreground" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes, Emberly is open source and can be self-hosted. See the
                repository for install instructions and deployment guides.
              </p>
            </details>

            <details className="group bg-background/40 border border-border/50 rounded-lg p-3">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                <span>How does billing work?</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Billing is handled via Stripe for SaaS plans. Team plans include
                seats and volume pricing contact sales for custom quotes.
              </p>
            </details>
          </div>
        </section>
      </section>
    </main>
  )
}
