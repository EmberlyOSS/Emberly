import React from 'react'
import { ChevronDown, CreditCard, Database, HelpCircle, RefreshCcw, Server, Users, Wallet } from 'lucide-react'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative">{children}</div>
        </div>
    )
}

const FAQ_ITEMS = [
    {
        icon: Server,
        question: 'Can I self-host?',
        answer: 'Yes, Emberly is open source and can be self-hosted. See the repository for install instructions and deployment guides.',
    },
    {
        icon: Users,
        question: 'How does billing work?',
        answer: 'Billing is handled via Stripe for SaaS plans. Team plans include seats and volume pricing—contact sales for custom quotes.',
    },
    {
        icon: RefreshCcw,
        question: 'Can I upgrade or downgrade anytime?',
        answer: 'Yes. Switch plans at any time—changes take effect immediately and future invoices are prorated automatically by Stripe.',
    },
    {
        icon: CreditCard,
        question: 'How are add-ons billed?',
        answer: 'Add-ons like extra storage or domains are one-time purchases unless labeled monthly. Quantities and totals are shown before checkout.',
    },
    {
        icon: Wallet,
        question: 'What happens if I cancel?',
        answer: 'You keep access until the end of the billing period. Data and links remain available; you can downgrade to Spark (Free) anytime.',
    },
    {
        icon: Database,
        question: 'Can I export my data?',
        answer: 'Yes. You can export your files and metadata at any time. Self-hosting is also available if you want full control.',
    },
]

export default function FaqSection() {
    return (
        <GlassCard className="mt-10">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-primary/20">
                        <HelpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                        <p className="text-sm text-muted-foreground">Everything you need to know about pricing</p>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                    {FAQ_ITEMS.map((item) => (
                        <details 
                            key={item.question} 
                            className="group rounded-xl border border-border/50 bg-background/50 overflow-hidden"
                        >
                            <summary className="p-4 font-medium cursor-pointer list-none flex items-center justify-between gap-3 hover:bg-background/80 transition-colors">
                                <div className="flex items-center gap-3">
                                    <item.icon className="h-4 w-4 text-primary shrink-0" />
                                    <span>{item.question}</span>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="px-4 pb-4 pt-0">
                                <p className="text-sm text-muted-foreground pl-7 leading-relaxed">
                                    {item.answer}
                                </p>
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </GlassCard>
    )
}
