import React, { useMemo } from 'react'
import AddOnSelector from '@/packages/components/pricing/AddOnSelector'

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
        <section className="mt-8 space-y-4">
            <div className="space-y-4">
                {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No add-ons are available right now.</p>
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
