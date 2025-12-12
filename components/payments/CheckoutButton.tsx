"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

type Props = {
    priceId: string
    mode?: 'subscription' | 'payment'
    label?: string
    type?: string
    quantity?: number
}

export default function CheckoutButton({ priceId, mode = 'subscription', label, type, quantity }: Props) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

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
                toast({ title: 'Checkout failed', description: 'Could not create a checkout session.', variant: 'destructive' })
            }
        } catch (err) {
            console.error(err)
            setLoading(false)
            toast({ title: 'Error', description: 'Error creating checkout session.', variant: 'destructive' })
        }
    }

    return (
        <Button onClick={handle} disabled={loading} className="w-full">
            {loading ? 'Redirecting...' : label || (mode === 'subscription' ? 'Start' : 'Buy')}
        </Button>
    )
}
