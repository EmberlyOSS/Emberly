import Link from 'next/link'

import { Check, Cloud, ShieldCheck, Star, Users, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Pricing — Emberly',
  description: 'Simple, predictable pricing for teams and builders.',
}

export default function PricingPage() {
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

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
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

              <div className="mt-6">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/register">Create free account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="relative border-2 border-primary">
            <CardContent className="p-6">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="rounded-full bg-primary text-white px-4 py-1 text-sm font-medium shadow-md">
                  Popular
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Pro</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      For power users
                    </p>
                  </div>
                  <div className="text-2xl font-extrabold">$12</div>
                </div>

                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span>Higher upload limits & priority uploads</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span>Custom domains</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span>Advanced usage analytics</span>
                  </li>

                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-500 mt-1" />
                    <span>Priority support</span>
                  </li>
                </ul>

                <div className="mt-6">
                  <Button asChild className="w-full">
                    <Link href="/auth/register">Start Pro</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Team</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    For teams & SSO
                  </p>
                </div>
                <div className="text-2xl font-extrabold">Contact</div>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Team seats & billing</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>SSO / SAML integration</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-1" />
                  <span>Priority SLA & support</span>
                </li>
              </ul>

              <div className="mt-6">
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/contact">Contact sales</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <details className="group bg-background/40 border border-border/50 rounded-lg p-3">
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                <span>Can I self-host?</span>
                <Star className="h-4 w-4 text-muted-foreground" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">
                Yes — Emberly is open source and can be self-hosted. See the
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
                seats and volume pricing — contact sales for custom quotes.
              </p>
            </details>
          </div>
        </section>
      </section>
    </main>
  )
}
