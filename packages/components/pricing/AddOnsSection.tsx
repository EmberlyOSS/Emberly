import React, { useMemo } from 'react'
import { Puzzle } from 'lucide-react'

import AddOnSelector from '@/packages/components/pricing/AddOnSelector'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative">{children}</div>
        </div>
    )
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
    addOns: AddOn[]
}

const UNIT_LABELS: Record<string, string> = {
    'extra-storage': 'GB',
    'custom-domain': 'domain',
}

export default function AddOnsSection({ addOns }: Props) {
    const list = useMemo(() => addOns, [addOns])

    return (
        <section className="mt-10 space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-primary/20">
                    <Puzzle className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Add-ons</h2>
                    <p className="text-sm text-muted-foreground">Extend your plan with additional features</p>
                </div>
            </div>

            <div className="space-y-4">
                {list.length === 0 ? (
                    <GlassCard>
                        <div className="p-8 text-center">
                            <Puzzle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-muted-foreground">No add-ons are available right now.</p>
                        </div>
                    </GlassCard>
                ) : null}
                {list.map((addon) => {
                    const unitLabel = UNIT_LABELS[addon.key] || 'unit'
                    return (
                        <AddOnSelector
                            key={addon.key}
                            title={addon.name}
                            description={addon.description}
                            pricePerUnit={addon.pricePerUnit}
                            unitLabel={unitLabel}
                            priceId={addon.priceId}
                            billingPeriod={addon.billingPeriod}
                            type={addon.key}
                            min={1}
                            max={50}
                            step={1}
                            defaultValue={1}
                        />
                    )
                })}
            </div>
        </section>
    )
}
