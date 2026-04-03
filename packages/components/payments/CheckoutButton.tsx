"use client"

import React, { useState } from 'react'
import { Button } from '@/packages/components/ui/button'
import { useToast } from '@/packages/hooks/use-toast'

type Props = {
    priceId: string
    mode?: 'subscription' | 'payment'
    label?: string
    type?: string
    quantity?: number
    className?: string
    variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

export default function CheckoutButton({ priceId, mode = 'subscription', label, type, quantity, className, variant, size }: Props) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handle = async () => {
        try {
            setLoading(true)
            const route = mode === 'subscription' ? '/api/payments/checkout' : '/api/payments/purchase'
            if (!priceId) {
                setLoading(false)
                toast({ title: 'Checkout failed', description: 'Missing price information.', variant: 'destructive' })
                return
            }

            const res = await fetch(route, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, type, quantity }),
            })

            if (!res.ok) {
                let msg = 'Could not create a checkout session.'
                try {
                    const json = await res.json()
                    if (json?.error) msg = json.error
                } catch (e) {
                    // ignore
                }
                console.error('Checkout error', res.status)
                setLoading(false)
                toast({ title: 'Checkout failed', description: msg, variant: 'destructive' })
                return
            }

            const data = await res.json()
            if (data?.url) {
                // use assign so it's slightly clearer for navigation intent
                window.location.assign(data.url)
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
        <Button onClick={handle} disabled={loading} variant={variant} size={size} className={className ?? 'w-full'} aria-label={label || (mode === 'subscription' ? 'Start subscription' : 'Buy')}>
            {loading ? 'Redirecting...' : label || (mode === 'subscription' ? 'Start' : 'Buy')}
        </Button>
    )
}
