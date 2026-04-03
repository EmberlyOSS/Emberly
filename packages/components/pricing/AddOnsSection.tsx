'use client'

import React, { useMemo } from 'react'
import { BadgeCheck, HardDrive, Globe, Puzzle, Upload } from 'lucide-react'

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
    scope: 'user' | 'squad'
}

// Maps slug → { unitLabel, category, isSquad }
const ADDON_META: Record<string, { unitLabel: string; category: string; isSquad: boolean }> = {
    'extra-storage-1gb':       { unitLabel: 'GB', category: 'storage', isSquad: false },
    'extra-storage-1gb-squad': { unitLabel: 'GB', category: 'storage', isSquad: true },
    'extra-domain-slot':       { unitLabel: 'domain', category: 'domains', isSquad: false },
    'extra-domain-slot-squad': { unitLabel: 'domain', category: 'domains', isSquad: true },
    'verify-personal':         { unitLabel: 'badge', category: 'verification', isSquad: false },
    'verify-squad':            { unitLabel: 'badge', category: 'verification', isSquad: true },
    'upload-cap-personal':     { unitLabel: 'GB', category: 'upload-cap', isSquad: false },
    'upload-cap-squad':        { unitLabel: 'GB', category: 'upload-cap', isSquad: true },
}

const CATEGORY_META: Record<string, { label: string; description: string; Icon: React.ElementType }> = {
    storage: {
        label: 'Extra Storage',
        description: 'Expand storage — billed monthly or yearly.',
        Icon: HardDrive,
    },
    domains: {
        label: 'Extra Domain Slots',
        description: 'Add more custom domains — billed annually.',
        Icon: Globe,
    },
    verification: {
        label: 'Verified Badge',
        description: 'Purchase verification instead of going through the standard review queue.',
        Icon: BadgeCheck,
    },
    'upload-cap': {
        label: 'Upload Cap Increase',
        description: 'Raise the maximum single-file upload size.',
        Icon: Upload,
    },
}

const CATEGORY_ORDER = ['storage', 'domains', 'verification', 'upload-cap']

export default function AddOnsSection({ addOns, scope }: Props) {
    const isSquadScope = scope === 'squad'

    const { scopedAddons, ungrouped } = useMemo(() => {
        const scoped: [string, AddOn][] = []
        const other: AddOn[] = []

        for (const addon of addOns) {
            const meta = ADDON_META[addon.key]
            if (!meta) { other.push(addon); continue }
            if (meta.isSquad === isSquadScope) {
                scoped.push([meta.category, addon])
            }
        }

        scoped.sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))

        return { scopedAddons: scoped, ungrouped: isSquadScope ? [] : other }
    }, [addOns, isSquadScope])

    if (scopedAddons.length === 0 && ungrouped.length === 0) {
        return (
            <section className="mt-10">
                <div className="glass-card overflow-hidden">
                    <div className="p-8 text-center">
                        <Puzzle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-muted-foreground">No {scope} add-ons are available right now.</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="mt-10 space-y-4">
            {/* Add-on list */}
            {scopedAddons.map(([category, addon]) => {
                const cm = CATEGORY_META[category]
                const meta = ADDON_META[addon.key]
                const isFixed = category === 'verification'

                return (
                    <AddOnSelector
                        key={category}
                        title={cm?.label ?? addon.name}
                        description={addon.description}
                        pricePerUnit={addon.pricePerUnit}
                        unitLabel={meta?.unitLabel ?? 'unit'}
                        priceId={addon.priceId}
                        billingPeriod={addon.billingPeriod}
                        type={addon.key}
                        min={1}
                        max={isFixed ? 1 : 50}
                        step={1}
                        defaultValue={1}
                    />
                )
            })}

            {/* Fallback: any add-ons not matched by ADDON_META */}
            {ungrouped.length > 0 && (
                <div className="space-y-4">
                    {ungrouped.map((addon) => (
                        <AddOnSelector
                            key={addon.key}
                            title={addon.name}
                            description={addon.description}
                            pricePerUnit={addon.pricePerUnit}
                            unitLabel="unit"
                            priceId={addon.priceId}
                            billingPeriod={addon.billingPeriod}
                            type={addon.key}
                            min={1}
                            max={50}
                            step={1}
                            defaultValue={1}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}
