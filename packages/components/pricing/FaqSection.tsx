import React from 'react'
import { CreditCard, Database, RefreshCcw, Star, Users, Wallet } from 'lucide-react'

export default function FaqSection() {
    return (
        <section className="mt-12">
            <h2 className="text-2xl font-semibold">Frequently asked</h2>
            <div className="mt-4 grid md:grid-cols-1 gap-4">
                <details className="group bg-background/40 border border-border/50 rounded-lg p-3">
                    <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                        <span>Can I self-host?</span>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Yes, Emberly is open source and can be self-hosted. See the repository for install instructions and deployment guides.
                    </p>
                </details>

                <details className="group bg-background/40 border border-border/50 rounded-lg p-3">
                    <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                        <span>How does billing work?</span>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Billing is handled via Stripe for SaaS plans. Team plans include seats and volume pricing—contact sales for custom quotes.
                    </p>
                </details>

                <details className="group bg-background/40 border border-border/50 rounded-lg p-3">
                    <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                        <span>Can I upgrade or downgrade anytime?</span>
                        <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Yes. Switch plans at any time—changes take effect immediately and future invoices are prorated automatically by Stripe.
                    </p>
                </details>

                <details className="group bg-background/40 border border-border/50 rounded-lg p-3">
                    <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                        <span>How are add-ons billed?</span>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Add-ons like extra storage or domains are one-time purchases unless labeled monthly. Quantities and totals are shown before checkout.
                    </p>
                </details>

                <details className="group bg-background/40 border border-border/50 rounded-lg p-3">
                    <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                        <span>What happens if I cancel?</span>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground">
                        You keep access until the end of the billing period. Data and links remain available; you can downgrade to Spark (Free) anytime.
                    </p>
                </details>

                <details className="group bg-background/40 border border-border/50 rounded-lg p-3">
                    <summary className="font-medium cursor-pointer list-none flex items-center justify-between hover:text-primary transition-colors">
                        <span>Can I export my data?</span>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Yes. You can export your files and metadata at any time. Self-hosting is also available if you want full control.
                    </p>
                </details>
            </div>
        </section>
    )
}
