"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
    priceId: string
    mode?: 'subscription' | 'payment'
    label?: string
    type?: string
    quantity?: number
}

export default function CheckoutButton({ priceId, mode = 'subscription', label, type, quantity }: Props) {
    const [loading, setLoading] = useState(false)

    const handle = async () => {
        try {
            setLoading(true)
            const route = mode === 'subscription' ? '/api/payments/checkout' : '/api/payments/purchase'
            const res = await fetch(route, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, type, quantity }),
            })
            const data = await res.json()
            if (data?.url) {
                window.location.href = data.url
            } else {
                console.error('No Checkout URL', data)
                setLoading(false)
                alert('Failed to create checkout session')
            }
        } catch (err) {
            console.error(err)
            setLoading(false)
            alert('Error creating checkout session')
        }
    }

    return (
        <Button onClick={handle} disabled={loading} className="w-full">
            {loading ? 'Redirecting...' : label || (mode === 'subscription' ? 'Start' : 'Buy')}
        </Button>
    )
}
