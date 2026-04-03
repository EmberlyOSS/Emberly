"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Gift, Heart, HelpCircle, Package, Shield, User, Users, Zap } from 'lucide-react'

import AddOnsSection from '@/packages/components/pricing/AddOnsSection'
import FaqSection from '@/packages/components/pricing/FaqSection'
import PlanSection from '@/packages/components/pricing/PlanSection'
import { Button } from '@/packages/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
import { ScrollIndicator } from '@/packages/components/ui/scroll-indicator'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            {children}
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
    discoveryPlans: Plan[]
    discoveryActivePlanKey: PlanKey
}

const tabSlugs: Record<string, string> = {
    plans: 'plans',
    discovery: 'discovery',
    'user-addons': 'user-add-ons',
    'squad-addons': 'squad-add-ons',
    faq: 'faq',
    donations: 'donations',
}

const slugToTab = Object.entries(tabSlugs).reduce<Record<string, string>>((acc, [tab, slug]) => {
    acc[slug] = tab
    return acc
}, { 'add-ons': 'user-addons' } as Record<string, string>) // backwards compat for old #add-ons hash

export default function PricingTabs({ plans, activePlanKey, addOns, discoveryPlans, discoveryActivePlanKey }: Props) {
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
                href: 'https://donate.stripe.com/3cI14ngRXcif5uAfif4ZG00',
                cta: 'Donate now',
                icon: Heart,
            },
            {
                name: 'PayPal',
                description: 'Use PayPal balance or bank for a quick tip.',
                href: 'https://paypal.me/codemeapixel',
                cta: 'Donate now',
                icon: Gift,
            },
            {
                name: 'GitHub Sponsors',
                description: 'Back Emberly on GitHub to support ongoing OSS work.',
                href: 'https://github.com/sponsors/EmberlyOSS',
                cta: 'Sponsor now',
                icon: Gift,
            },
            {
                name: 'Ko-fi',
                description: 'Send a one-time coffee to keep the lights on.',
                href: 'https://ko-fi.com/codemeapixel',
                cta: 'Donate now',
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
                                    className="glass-subtle p-5 flex flex-col"
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-1.5 rounded-2xl glass">
                <ScrollIndicator className="w-full sm:w-auto">
                <TabsList className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 h-auto min-w-max">
                    <TabsTrigger 
                        value="plans" 
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5"
                    >
                        <Zap className="h-3.5 w-3.5" />
                        Plans
                    </TabsTrigger>
                    <TabsTrigger 
                        value="discovery"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5"
                    >
                        <Shield className="h-3.5 w-3.5" />
                        Discovery
                    </TabsTrigger>
                    <TabsTrigger 
                        value="user-addons"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5"
                    >
                        <User className="h-3.5 w-3.5" />
                        User Add-ons
                    </TabsTrigger>
                    <TabsTrigger 
                        value="squad-addons"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5"
                    >
                        <Users className="h-3.5 w-3.5" />
                        Squad Add-ons
                    </TabsTrigger>
                    <TabsTrigger 
                        value="donations"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5"
                    >
                        <Heart className="h-3.5 w-3.5" />
                        Donations
                    </TabsTrigger>
                    <TabsTrigger 
                        value="faq"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5"
                    >
                        <HelpCircle className="h-3.5 w-3.5" />
                        FAQ
                    </TabsTrigger>
                </TabsList>
                </ScrollIndicator>

                {(tabValue === 'plans' || tabValue === 'discovery') && (
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
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setBillingCycle('yearly')}
                            >
                                Yearly
                                <span className={`text-xs font-semibold rounded-full px-1.5 py-0.5 transition-colors ${billingCycle === 'yearly' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/15 text-primary'}`}>
                                    50% off
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <TabsContent value="plans">
                <PlanSection plans={plans} activePlanKey={activePlanKey} billingCycle={billingCycle} />
            </TabsContent>

            <TabsContent value="discovery">
                <PlanSection plans={discoveryPlans} activePlanKey={discoveryActivePlanKey} billingCycle={billingCycle} />
            </TabsContent>

            <TabsContent value="user-addons">
                <AddOnsSection addOns={addOns} scope="user" />
            </TabsContent>

            <TabsContent value="squad-addons">
                <AddOnsSection addOns={addOns} scope="squad" />
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