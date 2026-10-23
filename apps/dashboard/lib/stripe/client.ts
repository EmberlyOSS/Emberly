/**
 * Centralized Stripe client factory.
 * Import this instead of instantiating Stripe directly in each route.
 */
import Stripe from 'stripe'

import { getIntegrations } from '@/lib/config'
import { stripeSecretKey } from '@/lib/config/env'

let _stripe: Stripe | null = null
let _stripeKey: string | null = null

export async function getStripeClient(): Promise<Stripe> {
    const integrations = await getIntegrations()
    const key = integrations.stripe?.secretKey || stripeSecretKey()
    if (!key) throw new Error('Stripe secret key is not configured')

    // Re-initialise if the key changed (e.g. admin updated it)
    if (_stripeKey !== key) {
        _stripeKey = key
        _stripe = new Stripe(key, { apiVersion: '2025-11-17.clover' as any })
    }
    return _stripe!
}

/** Returns true when a Stripe key is available (config or env). */
export async function isStripeConfigured(): Promise<boolean> {
    const integrations = await getIntegrations()
    return !!(
        integrations.stripe?.secretKey || stripeSecretKey()
    )
}
