"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Gift, Heart } from 'lucide-react'

import AddOnsSection from '@/packages/components/pricing/AddOnsSection'
import FaqSection from '@/packages/components/pricing/FaqSection'
import PlanSection from '@/packages/components/pricing/PlanSection'
import { Button } from '@/packages/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative">{children}</div>
        </div>
    )
}

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
                icon: Heart,
            },
            {
                name: 'PayPal',
                description: 'Use PayPal balance or bank for a quick tip.',
                href: '#',
                cta: 'COMING SOON',
                icon: Gift,
            },
            {
                name: 'GitHub Sponsors',
                description: 'Back Emberly on GitHub to support ongoing OSS work.',
                href: '#',
                cta: 'COMING SOON',
                icon: Gift,
            },
            {
                name: 'Ko-fi',
                description: 'Send a one-time coffee to keep the lights on.',
                href: '#',
                cta: 'COMING SOON',
                icon: Gift,
            },
        ]

        return (
            <GlassCard className="mt-10">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-primary/20">
                            <Heart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Support Emberly</h2>
                            <p className="text-sm text-muted-foreground">Help us keep building amazing features</p>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {options.map((option) => {
                            const isPlaceholder = option.href === '#'
                            return (
                                <div
                                    key={option.name}
                                    className="rounded-xl border border-border/50 bg-background/50 p-5 flex flex-col"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <option.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{option.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                                        </div>
                                    </div>
                                    {isPlaceholder ? (
                                        <Button size="sm" disabled variant="outline" className="mt-auto w-full">
                                            {option.cta}
                                        </Button>
                                    ) : (
                                        <Button asChild size="sm" className="mt-auto w-full">
                                            <Link href={option.href}>{option.cta}</Link>
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </GlassCard>
        )
    }, [])

    return (
        <Tabs value={tabValue} onValueChange={handleTabChange} className="mt-8">
            {/* Tabs Header with consistent styling */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-1.5 rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50">
                <TabsList className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 h-auto">
                    <TabsTrigger 
                        value="plans" 
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all"
                    >
                        Plans
                    </TabsTrigger>
                    <TabsTrigger 
                        value="addons"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all"
                    >
                        Add-ons
                    </TabsTrigger>
                    <TabsTrigger 
                        value="donations"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all"
                    >
                        Donations
                    </TabsTrigger>
                    <TabsTrigger 
                        value="faq"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all"
                    >
                        FAQ
                    </TabsTrigger>
                </TabsList>

                {tabValue === 'plans' && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Billing:</span>
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setBillingCycle('monthly')}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setBillingCycle('yearly')}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                )}
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