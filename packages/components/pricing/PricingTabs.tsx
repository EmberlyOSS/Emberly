"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import AddOnsSection from '@/packages/components/pricing/AddOnsSection'
import FaqSection from '@/packages/components/pricing/FaqSection'
import PlanSection from '@/packages/components/pricing/PlanSection'
import { Button } from '@/packages/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'

type PlanKey = string

type Plan = {
    id?: string
    key: PlanKey
    name: string
    price: string
    priceYearly?: string
    description: string
    features: string[]
    priceIdMonthly?: string | null
    priceIdYearly?: string | null
    highlight?: string
    popular?: boolean
}

type AddOn = {
    key: string
    name: string
    description: string
    priceId: string
    billingPeriod: 'monthly' | 'one-time'
    pricePerUnit: number | null
    features: string[]
}

type Props = {
    plans: Plan[]
    activePlanKey: PlanKey
    addOns: AddOn[]
}

const tabSlugs: Record<string, string> = {
    plans: 'plans',
    addons: 'add-ons',
    faq: 'faq',
    donations: 'donations',
}

const slugToTab = Object.entries(tabSlugs).reduce<Record<string, string>>((acc, [tab, slug]) => {
    acc[slug] = tab
    return acc
}, {})

export default function PricingTabs({ plans, activePlanKey, addOns }: Props) {
    const [tabValue, setTabValue] = useState<string>('plans')
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

    useEffect(() => {
        if (typeof window === 'undefined') return
        const raw = window.location.hash.replace('#', '').toLowerCase()
        if (raw && slugToTab[raw]) {
            setTabValue(slugToTab[raw])
        }
    }, [])

    const updateHash = useCallback((value: string) => {
        if (typeof window === 'undefined') return
        const slug = tabSlugs[value] || value
        const url = `${window.location.pathname}${window.location.search}#${slug}`
        window.history.replaceState(null, '', url)
    }, [])

    const handleTabChange = useCallback((value: string) => {
        setTabValue(value)
        updateHash(value)
    }, [updateHash])

    const copyLink = useCallback(() => {
        if (typeof window === 'undefined') return
        const slug = tabSlugs[tabValue] || tabValue
        const link = `${window.location.origin}${window.location.pathname}${window.location.search}#${slug}`
        navigator.clipboard?.writeText(link).catch(() => { })
    }, [tabValue])

    const donationSection = useMemo(() => {
        const options = [
            {
                name: 'Stripe',
                description: 'Quick and secure one-time donations via Stripe.',
                href: 'https://donate.stripe.com/bJe3cv6cHc9j9encEHf3a00',
                cta: 'Donate now',
            },
            {
                name: 'PayPal',
                description: 'Use PayPal balance or bank for a quick tip.',
                href: '#',
                cta: 'COMING SOON',
            },
            {
                name: 'GitHub Sponsors',
                description: 'Back Emberly on GitHub to support ongoing OSS work.',
                href: '#',
                cta: 'COMING SOON',
            },
            {
                name: 'Ko-fi',
                description: 'Send a one-time coffee to keep the lights on.',
                href: '#',
                cta: 'COMING SOON',
            },
        ]

        return (
            <div className="mt-10 space-y-4">
                {options.map((option) => {
                    const isPlaceholder = option.href === '#'
                    return (
                        <div
                            key={option.name}
                            className="rounded-2xl border border-border/50 bg-background/50 p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold">{option.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                                </div>
                                {isPlaceholder ? (
                                    <Button size="sm" disabled title="Coming soon">
                                        {option.cta}
                                    </Button>
                                ) : (
                                    <Button asChild size="sm">
                                        <Link href={option.href}>{option.cta}</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }, [])

    return (
        <Tabs value={tabValue} onValueChange={handleTabChange} className="mt-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <TabsList>
                    <TabsTrigger value="plans">Plans</TabsTrigger>
                    <TabsTrigger value="addons">Add-ons</TabsTrigger>
                    <TabsTrigger value="donations">Donations</TabsTrigger>
                    <TabsTrigger value="faq">FAQ</TabsTrigger>
                </TabsList>

                {tabValue === 'plans' ? (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Billing</span>
                        <div className="inline-flex rounded-full border border-border/60 p-1 text-xs font-medium">
                            <button
                                type="button"
                                className={`px-3 py-1 rounded-full ${billingCycle === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                                onClick={() => setBillingCycle('monthly')}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1 rounded-full ${billingCycle === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                                onClick={() => setBillingCycle('yearly')}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            <TabsContent value="plans">
                <PlanSection plans={plans} activePlanKey={activePlanKey} billingCycle={billingCycle} />
            </TabsContent>

            <TabsContent value="addons">
                <AddOnsSection addOns={addOns} />
            </TabsContent>

            <TabsContent value="faq">
                <FaqSection />
            </TabsContent>

            <TabsContent value="donations">
                {donationSection}
            </TabsContent>
        </Tabs>
    )
}