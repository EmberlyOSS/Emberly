"use client"

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Package } from 'lucide-react'

import CheckoutButton from '@/packages/components/payments/CheckoutButton'
import { Button } from '@/packages/components/ui/button'

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            {children}
        </div>
    )
}

// Minimal slider using input[type=range] so we don't depend on a UI slider package.
function QuantitySlider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-full accent-primary h-2 rounded-full bg-border/50"
        />
    )
}

interface AddOnSelectorProps {
    title: string
    description: string
    pricePerUnit: number | null
    unitLabel: string
    priceId: string
    mode?: 'subscription' | 'payment'
    type?: string
    billingPeriod?: 'one-time' | 'monthly' | 'yearly'
    min?: number
    max?: number
    step?: number
    defaultValue?: number
}

export default function AddOnSelector({
    title,
    description,
    pricePerUnit,
    unitLabel,
    priceId,
    mode: modeProp,
    type,
    billingPeriod = 'one-time',
    min = 1,
    max = 50,
    step = 1,
    defaultValue = 1,
}: AddOnSelectorProps) {
    const mode = modeProp ?? (billingPeriod === 'yearly' ? 'subscription' : 'payment')
    const isFixed = min === max
    const [open, setOpen] = useState(false)
    const [qty, setQty] = useState(defaultValue)

    const total = useMemo(() => pricePerUnit != null ? (qty * pricePerUnit).toFixed(2) : '—', [qty, pricePerUnit])

    const marks = useMemo(() => {
        const desiredStops = 6
        const stepCount = Math.floor((max - min) / step)
        const slots = Math.min(desiredStops, stepCount + 1)
        if (slots <= 1) return [min, max]

        const values: number[] = []
        const interval = (max - min) / (slots - 1)
        for (let i = 0; i < slots; i++) {
            const raw = min + interval * i
            const snapped = Math.min(max, Math.max(min, Math.round(raw / step) * step))
            values.push(snapped)
        }
        const deduped = Array.from(new Set(values)).sort((a, b) => a - b)
        if (deduped[0] !== min) deduped.unshift(min)
        if (deduped[deduped.length - 1] !== max) deduped.push(max)
        return deduped
    }, [min, max, step])

    return (
        <GlassCard>
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-primary/20 shrink-0">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-2xl font-extrabold text-primary">
                                    {pricePerUnit != null ? `$${pricePerUnit.toFixed(2)}` : '—'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    / {unitLabel} ({billingPeriod === 'monthly' ? 'per month' : billingPeriod === 'yearly' ? 'per year' : 'one-time'})
                                </span>
                            </div>
                        </div>
                    </div>
                    {isFixed ? (
                        <CheckoutButton
                            priceId={priceId}
                            mode={mode}
                            label="Purchase"
                            type={type}
                            quantity={1}
                            variant="outline"
                            size="sm"
                            className="shrink-0 bg-background/50"
                        />
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} className="shrink-0 bg-background/50">
                            {open ? (
                                <>
                                    Hide <ChevronUp className="w-4 h-4 ml-2" />
                                </>
                            ) : (
                                <>
                                    Configure <ChevronDown className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {!isFixed && open && (
                    <div className="mt-6 pt-6 border-t border-border/50 space-y-4">
                        {pricePerUnit == null || !priceId ? (
                            <p className="text-sm text-muted-foreground">Pricing not set for this add-on.</p>
                        ) : (
                            <>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Quantity</span>
                                    <span className="font-bold text-primary">{qty} {unitLabel}</span>
                                </div>
                                <QuantitySlider value={qty} min={min} max={max} step={step} onChange={setQty} />
                                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                    {marks.map((mark) => {
                                        const active = qty === mark
                                        return (
                                            <button
                                                key={mark}
                                                type="button"
                                                onClick={() => setQty(mark)}
                                                className={`flex-1 min-w-0 text-center px-2 py-1.5 rounded-lg border transition-all ${active ? 'border-primary text-primary bg-primary/10 font-medium' : 'border-border/50 hover:border-primary/50 hover:text-primary bg-background/50'}`}
                                            >
                                                {mark}
                                            </button>
                                        )
                                    })}
                                </div>
                                <div className="flex items-center justify-between p-4 glass-subtle">
                                    <span className="text-sm font-medium">Total</span>
                                    <span className="text-xl font-bold">${total}</span>
                                </div>
                                <CheckoutButton
                                    priceId={priceId}
                                    mode={mode}
                                    label={`Purchase ${qty} ${unitLabel}`}
                                    type={type}
                                    quantity={qty}
                                    className="w-full"
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
        </GlassCard>
    )
}
