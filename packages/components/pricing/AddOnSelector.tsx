"use client"

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import CheckoutButton from '@/packages/components/payments/CheckoutButton'
import { Button } from '@/packages/components/ui/button'

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
            className="w-full accent-primary"
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
    billingPeriod?: 'one-time' | 'monthly'
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
    mode = 'payment',
    type,
    billingPeriod = 'one-time',
    min = 1,
    max = 50,
    step = 1,
    defaultValue = 1,
}: AddOnSelectorProps) {
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
        <div className="rounded-2xl border border-border/50 bg-background/50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-extrabold">STARTING AT:</span>{" "}
                        <span className="font-medium text-primary">
                            {pricePerUnit != null ? `$${pricePerUnit.toFixed(2)} / ${unitLabel} (${billingPeriod === 'monthly' ? 'per month' : 'one-time'})` : 'Set pricing to enable checkout'}
                        </span>
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
                    {open ? (
                        <>
                            Hide <ChevronUp className="w-4 h-4 ml-2" />
                        </>
                    ) : (
                        <>
                            Buy <ChevronDown className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>

            {open && (
                <div className="mt-4 space-y-4">
                    {pricePerUnit == null || !priceId ? (
                        <p className="text-sm text-muted-foreground">Pricing not set for this add-on.</p>
                    ) : (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span>Quantity</span>
                                <span className="font-medium">{qty} {unitLabel}</span>
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
                                            className={`flex-1 min-w-0 text-center px-2 py-1 rounded-md border transition-colors ${active ? 'border-primary text-primary bg-primary/10' : 'border-border/60 hover:border-primary/60 hover:text-primary'}`}
                                        >
                                            {mark}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>Total</span>
                                <span className="font-semibold">${total}</span>
                            </div>
                            <CheckoutButton
                                priceId={priceId}
                                mode={mode}
                                label={`Buy ${qty} ${unitLabel}`}
                                type={type}
                                quantity={qty}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
