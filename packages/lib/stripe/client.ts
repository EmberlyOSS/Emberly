/**
 * Centralized Stripe client factory.
 * Import this instead of instantiating Stripe directly in each route.
 */
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripeClient(): Stripe {
    if (_stripe) return _stripe

    const key = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET (or STRIPE_SECRET_KEY) is not set')

    _stripe = new Stripe(key, { apiVersion: '2025-11-17.clover' as any })
    return _stripe
}
