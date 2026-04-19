"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp, Sparkles, Star, Settings } from 'lucide-react'

import CheckoutButton from '@/packages/components/payments/CheckoutButton'
import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'

// Reusable GlassCard component
function GlassCard({ children, className = '', highlight = false }: { children: React.ReactNode; className?: string; highlight?: boolean }) {
    return (
        <div className={`glass-card overflow-hidden transition-all duration-300 hover:shadow-xl ${highlight ? 'border-primary/50 shadow-primary/10 ring-1 ring-primary/20' : ''} ${className}`}>
            {highlight && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-accent" />
            )}
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

type Props = {
    plans: Plan[]
    activePlanKey: PlanKey
    billingCycle: 'monthly' | 'yearly'
}

function splitPrice(price: string): { amount: string; cadence: string | null } {
    const [amountPart, cadencePart] = price.split('/')
    if (!cadencePart) return { amount: price, cadence: null }
    return { amount: amountPart.trim(), cadence: `/${cadencePart.trim()}` }
}

// Current Plan Banner Component
function CurrentPlanBanner({ plan, billingCycle }: { plan: Plan; billingCycle: 'monthly' | 'yearly' }) {
    const displayPrice = billingCycle === 'yearly' && plan.priceYearly ? plan.priceYearly : plan.price
    const { amount, cadence } = splitPrice(displayPrice)

    return (
        <GlassCard className="mb-8" highlight>
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    {/* Left: Plan Info */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                            <Star className="h-6 w-6 text-primary fill-primary/30" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                                    Current Plan
                                </Badge>
                            </div>
                            <h3 className="text-2xl font-bold">{plan.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                        </div>
                    </div>

                    {/* Center: Price */}
                    <div className="md:text-center">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold">{amount}</span>
                            {cadence && <span className="text-muted-foreground">{cadence}</span>}
                        </div>
                        {billingCycle === 'yearly' && plan.priceYearly && (
                            <p className="text-xs text-primary mt-1">
                                <Sparkles className="h-3 w-3 inline mr-1" />
                                Yearly billing
                            </p>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" className="bg-background/50">
                            <Link href="/api/payments/portal">
                                <Settings className="h-4 w-4 mr-2" />
                                Manage Billing
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Features Preview */}
                <div className="mt-6 pt-6 border-t border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Your plan includes</p>
                    <div className="flex flex-wrap gap-2">
                        {plan.features.slice(0, 6).map((feature) => (
                            <span key={feature} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
                                <Check className="h-3 w-3 text-primary" />
                                {feature}
                            </span>
                        ))}
                        {plan.features.length > 6 && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted/50 text-xs text-primary">
                                +{plan.features.length - 6} more
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </GlassCard>
    )
}

// Plan Card Component
function PlanCard({ plan, billingCycle, isOpen, onToggle }: { 
    plan: Plan; 
    billingCycle: 'monthly' | 'yearly'; 
    isOpen: boolean; 
    onToggle: () => void 
}) {
    const displayPrice = billingCycle === 'yearly' && plan.priceYearly ? plan.priceYearly : plan.price
    const { amount, cadence } = splitPrice(displayPrice)

    return (
        <GlassCard highlight={plan.popular}>
            <div className="p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            {plan.popular && (
                                <Badge className="bg-primary/20 text-primary border-primary/30">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Popular
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold">{amount}</span>
                        {cadence && <span className="text-muted-foreground">{cadence}</span>}
                    </div>
                    {billingCycle === 'yearly' && plan.priceYearly && (
                        <p className="text-xs text-primary mt-1">
                            <Sparkles className="h-3 w-3 inline mr-1" />
                            Save with yearly billing
                        </p>
                    )}
                </div>

                {/* Features */}
                <div className="flex-1">
                    <ul className="space-y-3 text-sm">
                        {plan.features.slice(0, isOpen ? undefined : 4).map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                                <div className="mt-0.5 p-1 rounded-full bg-primary/20">
                                    <Check className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-muted-foreground">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    {plan.features.length > 4 && (
                        <button
                            type="button"
                            onClick={onToggle}
                            className="mt-3 text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                        >
                            {isOpen ? (
                                <>Show less <ChevronUp className="h-3 w-3" /></>
                            ) : (
                                <>+{plan.features.length - 4} more features <ChevronDown className="h-3 w-3" /></>
                            )}
                        </button>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-6 pt-4 border-t border-border/50">
                    {plan.key === 'oss' ? (
                        <Button disabled variant="outline" className="w-full bg-background/50" title="Open-source coming soon">
                            Coming soon
                        </Button>
                    ) : plan.key === 'enterprise' ? (
                        <Button asChild className="w-full">
                            <Link href="/contact">Talk to sales</Link>
                        </Button>
                    ) : plan.key === 'free' || plan.key === 'spark' ? (
                        <Button asChild variant="outline" className="w-full bg-background/50">
                            <Link href="/auth/register">Get started free</Link>
                        </Button>
                    ) : (
                        (() => {
                            const selectedPriceId = billingCycle === 'yearly' ? plan.priceIdYearly : plan.priceIdMonthly
                            const missingPrice = !selectedPriceId
                            return (
                                <CheckoutButton
                                    priceId={selectedPriceId || ''}
                                    mode="subscription"
                                    label={plan.popular ? `Get ${plan.name}` : `Start ${plan.name}`}
                                    disabled={missingPrice}
                                    title={missingPrice ? 'Price ID not set yet' : undefined}
                                    className="w-full"
                                />
                            )
                        })()
                    )}
                </div>
            </div>
        </GlassCard>
    )
}

export default function PlanSection({ plans, activePlanKey, billingCycle }: Props) {
    const [openPlans, setOpenPlans] = useState<Record<string, boolean>>({})

    const togglePlan = (key: PlanKey) => {
        setOpenPlans((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    // Separate current plan from other plans
    const currentPlan = plans.find((plan) => plan.key === activePlanKey)
    const otherPlans = plans.filter((plan) => plan.key !== activePlanKey)

    return (
        <div className="mt-10">
            {/* Current Plan Banner */}
            {currentPlan && (
                <CurrentPlanBanner plan={currentPlan} billingCycle={billingCycle} />
            )}

            {/* Section Header for Other Plans */}
            {currentPlan && otherPlans.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold">Upgrade your plan</h3>
                    <p className="text-sm text-muted-foreground">Choose a plan that better fits your needs</p>
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
                {otherPlans.map((plan) => (
                    <PlanCard 
                        key={plan.key}
                        plan={plan}
                        billingCycle={billingCycle}
                        isOpen={openPlans[plan.key] || false}
                        onToggle={() => togglePlan(plan.key)}
                    />
                ))}
            </div>
        </div>
    )
}