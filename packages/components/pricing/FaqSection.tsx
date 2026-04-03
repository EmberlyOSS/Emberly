'use client'

import FAQAccordion from '@/packages/components/shared/faq-accordion'
import { Badge } from '@/packages/components/ui/badge'

const FAQ_ITEMS = [
    {
        question: 'Can I self-host?',
        answer: 'Yes, Emberly is open source and can be self-hosted. See the repository for install instructions and deployment guides.',
    },
    {
        question: 'How does billing work?',
        answer: 'Billing is handled via Stripe for SaaS plans. Team plans include seats and volume pricing—contact sales for custom quotes.',
    },
    {
        question: 'Can I upgrade or downgrade anytime?',
        answer: 'Yes. Switch plans at any time—changes take effect immediately and future invoices are prorated automatically by Stripe.',
    },
    {
        question: 'How are add-ons billed?',
        answer: 'Storage and upload-cap add-ons are billed monthly or yearly (save 50% with annual). Domain slots renew annually. Verification badges are one-time purchases. Quantities and totals are shown before checkout.',
    },
    {
        question: 'What happens if I cancel?',
        answer: 'You keep access until the end of the billing period. Data and links remain available; you can downgrade to Spark (Free) anytime.',
    },
    {
        question: 'Can I export my data?',
        answer: 'Yes. You can export your files and metadata at any time. Self-hosting is also available if you want full control.',
    },
]

export default function FaqSection() {
    return (
        <section className="mt-10">
            <div className="text-center mb-12">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    FAQ
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                    Frequently Asked Questions
                </h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                    Quick answers to common questions about pricing
                </p>
            </div>

            <FAQAccordion items={FAQ_ITEMS} />
        </section>
    )
}

