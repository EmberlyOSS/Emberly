"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

import CheckoutButton from '@/packages/components/payments/CheckoutButton'
import { Button } from '@/packages/components/ui/button'

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

export default function PlanSection({ plans, activePlanKey, billingCycle }: Props) {
    const [openPlans, setOpenPlans] = useState<Record<string, boolean>>({})

    const togglePlan = (key: PlanKey) => {
        setOpenPlans((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="mt-10 space-y-4">
            {plans.map((plan) => (
                <div
                    key={plan.key}
                    className={`rounded-2xl border border-border/50 bg-background/50 p-5 shadow-sm ${plan.popular ? 'border-primary/60 shadow-lg shadow-primary/15 ring-1 ring-primary/20' : ''}`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-semibold">{plan.name}</h3>
                                {(plan.popular) ? (
                                    <span className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-secondary text-white'}`}>
                                        {plan.popular ? 'Popular choice' : plan.highlight}
                                    </span>
                                ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            {(() => {
                                const displayPrice = billingCycle === 'yearly' && plan.priceYearly ? plan.priceYearly : plan.price
                                const { amount, cadence } = splitPrice(displayPrice)
                                return (
                                    <div className="text-xl font-extrabold">
                                        <span>{amount}</span>
                                        {cadence ? <span className="text-primary">{` ${cadence}`}</span> : null}
                                    </div>
                                )
                            })()}
                            <Button variant="outline" size="sm" onClick={() => togglePlan(plan.key)}>
                                {openPlans[plan.key] ? (
                                    <>
                                        Hide info <ChevronUp className="w-4 h-4 ml-2" />
                                    </>
                                ) : (
                                    <>
                                        More info <ChevronDown className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {openPlans[plan.key] && (
                        <div className="mt-4 space-y-4">
                            <ul className="space-y-3 text-sm">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check className="h-4 w-4 text-green-500 mt-1" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="text-sm text-muted-foreground">
                                    {plan.key === 'free'
                                        ? 'Great for trying Emberly.'
                                        : plan.key === 'oss'
                                            ? 'Self-host and customize limits.'
                                            : plan.key === 'enterprise'
                                                ? 'Talk to us for tailored terms.'
                                                : 'Upgrade anytime.'}
                                </div>
                                <div className="sm:w-48">
                                    {activePlanKey === plan.key ? (
                                        <Button disabled className="w-full">Current plan</Button>
                                    ) : plan.key === 'oss' ? (
                                        <Button disabled variant="ghost" className="w-full" title="Open-source coming soon">
                                            Coming soon
                                        </Button>
                                    ) : plan.key === 'enterprise' ? (
                                        <Button asChild className="w-full">
                                            <Link href="/contact">Talk to sales</Link>
                                        </Button>
                                    ) : plan.key === 'free' ? (
                                        <Button asChild variant="outline" className="w-full">
                                            <Link href="/auth/register">Create free account</Link>
                                        </Button>
                                    ) : (
                                        (() => {
                                            const selectedPriceId = billingCycle === 'yearly' ? plan.priceIdYearly : plan.priceIdMonthly
                                            const missingPrice = !selectedPriceId
                                            return (
                                                <CheckoutButton
                                                    priceId={selectedPriceId || ''}
                                                    mode="subscription"
                                                    label={`Start ${plan.name}${billingCycle === 'yearly' ? ' (yearly)' : ''}`}
                                                    disabled={missingPrice}
                                                    title={missingPrice ? 'Price ID not set yet' : undefined}
                                                />
                                            )
                                        })()
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
