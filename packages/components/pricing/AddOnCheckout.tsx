"use client"

import { useState } from 'react'
import CheckoutButton from '@/packages/components/payments/CheckoutButton'

interface Props {
    priceId: string
    mode?: 'subscription' | 'payment'
    label?: string
    type?: string
    initialQuantity?: number
    options?: number[]
}

export default function AddOnCheckout({
    priceId,
    mode = 'payment',
    label,
    type,
    initialQuantity = 1,
    options = [1, 2, 5, 10, 20],
}: Props) {
    const [qty, setQty] = useState<number>(initialQuantity)

    return (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="sr-only">Quantity</label>
            <select
                className="rounded border px-3 py-1 bg-secondary"
                value={String(qty)}
                onChange={(e) => setQty(parseInt(e.target.value, 10))}
            >
                {options.map((o) => (
                    <option key={o} value={o}>{o}{type === 'extra_storage' ? ' GB' : type === 'custom_domain' && o > 1 ? ' domains' : ''}</option>
                ))}
            </select>

            <CheckoutButton
                priceId={priceId}
                mode={mode}
                label={label}
                type={type}
                quantity={qty}
            />
        </div>
    )
}
