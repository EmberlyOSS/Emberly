/**
 * Stripe product/price sync utilities.
 *
 * Rules:
 *  - Product metadata (name, description, active) is always kept up-to-date.
 *  - Prices are IMMUTABLE in Stripe — this utility only creates missing ones.
 *    To change a price amount, clear the price ID in the DB and re-run sync
 *    (the old price will remain in Stripe but won't be referenced by Emberly).
 *  - All operations are idempotent and safe to call multiple times.
 *  - If STRIPE_SECRET is not configured the function is a no-op.
 */

import { getStripeClient } from './client'

export interface ProductSyncInput {
  slug: string
  name: string
  description: string | null
  type: string
  defaultPriceCents: number | null
  billingInterval: string | null
  active: boolean
  // Existing Stripe IDs — null means "not yet synced"
  stripeProductId: string | null
  stripePriceMonthlyId: string | null
  stripePriceYearlyId: string | null
  stripePriceOneTimeId: string | null
}

export interface ProductSyncResult {
  stripeProductId: string | null
  stripePriceMonthlyId: string | null
  stripePriceYearlyId: string | null
  stripePriceOneTimeId: string | null
}

/**
 * Sync a product to Stripe.
 *
 * - Creates the Stripe product if it doesn't exist yet.
 * - Updates name / description / active on an existing Stripe product.
 * - Creates missing prices (monthly, yearly, or one-time) based on the plan type.
 * - Never overwrites existing price IDs.
 *
 * Returns the full set of Stripe IDs (unchanged fields preserved from input).
 */
export async function syncProductToStripe(product: ProductSyncInput): Promise<ProductSyncResult> {
  const stripeKey = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return {
      stripeProductId: product.stripeProductId,
      stripePriceMonthlyId: product.stripePriceMonthlyId,
      stripePriceYearlyId: product.stripePriceYearlyId,
      stripePriceOneTimeId: product.stripePriceOneTimeId,
    }
  }

  const stripe = getStripeClient()

  const result: ProductSyncResult = {
    stripeProductId: product.stripeProductId,
    stripePriceMonthlyId: product.stripePriceMonthlyId,
    stripePriceYearlyId: product.stripePriceYearlyId,
    stripePriceOneTimeId: product.stripePriceOneTimeId,
  }

  // ── 1. Create or update the Stripe product ────────────────────────────────
  try {
    if (!result.stripeProductId) {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description || undefined,
        active: product.active,
        metadata: { emberly_slug: product.slug, emberly_type: product.type },
      })
      result.stripeProductId = stripeProduct.id
    } else {
      try {
        await stripe.products.update(result.stripeProductId, {
          name: product.name,
          description: product.description || '',
          active: product.active,
          metadata: { emberly_slug: product.slug, emberly_type: product.type },
        })
      } catch (updateErr: any) {
        // Stale product ID (e.g. from test mode) — create a fresh one
        if (updateErr?.raw?.code === 'resource_missing') {
          console.warn(`[stripe-sync] Stale product ID for "${product.slug}", creating new Stripe product`)
          result.stripeProductId = null
          result.stripePriceMonthlyId = null
          result.stripePriceYearlyId = null
          result.stripePriceOneTimeId = null
          const stripeProduct = await stripe.products.create({
            name: product.name,
            description: product.description || undefined,
            active: product.active,
            metadata: { emberly_slug: product.slug, emberly_type: product.type },
          })
          result.stripeProductId = stripeProduct.id
        } else {
          throw updateErr
        }
      }
    }
  } catch (err) {
    console.warn(`[stripe-sync] Failed to create/update Stripe product for "${product.slug}":`, err)
    return result
  }

  // Free or custom-priced plans don't need Stripe prices
  const cents = product.defaultPriceCents
  if (!cents || cents <= 0 || !result.stripeProductId) return result

  const isPlan = product.type === 'plan' || product.type === 'nexium-plan'
  const isAddon = product.type === 'addon'

  // ── 2. Create missing prices ───────────────────────────────────────────────
  if (isPlan && product.billingInterval === 'month') {
    if (!result.stripePriceMonthlyId) {
      try {
        const price = await stripe.prices.create({
          product: result.stripeProductId,
          unit_amount: cents,
          currency: 'cad',
          recurring: { interval: 'month' },
          metadata: { emberly_slug: product.slug, emberly_period: 'monthly' },
        })
        result.stripePriceMonthlyId = price.id
      } catch (err) {
        console.warn(`[stripe-sync] Failed to create monthly price for "${product.slug}":`, err)
      }
    }

    if (!result.stripePriceYearlyId) {
      try {
        const price = await stripe.prices.create({
          product: result.stripeProductId,
          unit_amount: Math.round(cents * 6), // 50% off yearly
          currency: 'cad',
          recurring: { interval: 'year' },
          metadata: { emberly_slug: product.slug, emberly_period: 'yearly' },
        })
        result.stripePriceYearlyId = price.id
      } catch (err) {
        console.warn(`[stripe-sync] Failed to create yearly price for "${product.slug}":`, err)
      }
    }
  }

  // Addon with monthly billing → create monthly + yearly prices
  if (isAddon && product.billingInterval === 'month') {
    if (!result.stripePriceMonthlyId) {
      try {
        const price = await stripe.prices.create({
          product: result.stripeProductId,
          unit_amount: cents,
          currency: 'cad',
          recurring: { interval: 'month' },
          metadata: { emberly_slug: product.slug, emberly_period: 'monthly' },
        })
        result.stripePriceMonthlyId = price.id
      } catch (err) {
        console.warn(`[stripe-sync] Failed to create monthly addon price for "${product.slug}":`, err)
      }
    }
    if (!result.stripePriceYearlyId) {
      try {
        const price = await stripe.prices.create({
          product: result.stripeProductId,
          unit_amount: Math.round(cents * 6), // 50% off yearly
          currency: 'cad',
          recurring: { interval: 'year' },
          metadata: { emberly_slug: product.slug, emberly_period: 'yearly' },
        })
        result.stripePriceYearlyId = price.id
      } catch (err) {
        console.warn(`[stripe-sync] Failed to create yearly addon price for "${product.slug}":`, err)
      }
    }
  }

  // Addon with yearly billing (e.g. domain slots) → create yearly price only
  if (isAddon && product.billingInterval === 'year') {
    if (!result.stripePriceYearlyId) {
      try {
        const price = await stripe.prices.create({
          product: result.stripeProductId,
          unit_amount: cents,
          currency: 'cad',
          recurring: { interval: 'year' },
          metadata: { emberly_slug: product.slug, emberly_period: 'yearly' },
        })
        result.stripePriceYearlyId = price.id
      } catch (err) {
        console.warn(`[stripe-sync] Failed to create yearly addon price for "${product.slug}":`, err)
      }
    }
  }

  if (isAddon && (product.billingInterval === 'one-time' || product.billingInterval === null)) {
    if (!result.stripePriceOneTimeId) {
      try {
        const price = await stripe.prices.create({
          product: result.stripeProductId,
          unit_amount: cents,
          currency: 'cad',
          metadata: { emberly_slug: product.slug, emberly_period: 'one-time' },
        })
        result.stripePriceOneTimeId = price.id
      } catch (err) {
        console.warn(`[stripe-sync] Failed to create one-time price for "${product.slug}":`, err)
      }
    }
  }

  return result
}

/**
 * Archive a Stripe product and deactivate all of its active prices.
 * Must be called before deleting a product from the DB.
 * Silently no-ops if Stripe is not configured or the product ID is missing.
 */
export async function archiveStripeProduct(stripeProductId: string | null): Promise<void> {
  const stripeKey = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY
  if (!stripeKey || !stripeProductId) return

  const stripe = getStripeClient()

  try {
    // Stripe requires all prices to be deactivated before a product can be archived
    const prices = await stripe.prices.list({ product: stripeProductId, active: true, limit: 100 })
    await Promise.all(prices.data.map((p) => stripe.prices.update(p.id, { active: false })))
    await stripe.products.update(stripeProductId, { active: false })
  } catch (err) {
    console.warn(`[stripe-sync] Failed to archive Stripe product "${stripeProductId}":`, err)
  }
}
