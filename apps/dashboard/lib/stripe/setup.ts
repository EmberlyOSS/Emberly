import Stripe from 'stripe'

import { prisma } from '@emberly/db'

import { getIntegrations, updateConfigSection } from '@/lib/config'
import { appUrl, stripeSecretKey } from '@/lib/config/env'
import { syncCatalog } from '@/lib/products/catalog'

const API_VERSION = '2025-11-17.clover' as Stripe.LatestApiVersion

export const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] =
  [
    'checkout.session.completed',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'charge.failed',
    'charge.refunded',
  ]

export interface StripeSetupStatus {
  connected: boolean
  account?: { id: string; name: string | null; livemode: boolean }
  webhook: {
    state: 'ok' | 'missing' | 'outdated' | 'local'
    url: string
    missingEvents: string[]
  }
  products: { total: number; unsynced: string[]; unpriced: string[] }
  error?: string
}

const webhookUrl = () => `${appUrl()}/api/payments/webhook`
const isLocal = () =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(appUrl())

async function currentKey() {
  return (await getIntegrations()).stripe?.secretKey || stripeSecretKey() || ''
}

async function saveStripe(values: {
  secretKey?: string
  webhookSecret?: string
}) {
  const integrations = await getIntegrations()
  await updateConfigSection('integrations', {
    ...integrations,
    stripe: { ...integrations.stripe, ...values },
  })
}

async function productStatus() {
  const products = await prisma.product.findMany({ where: { active: true } })
  const paid = products.filter((p) => (p.defaultPriceCents ?? 0) > 0)
  return {
    total: products.length,
    unsynced: paid
      .filter(
        (p) =>
          !p.stripePriceMonthlyId &&
          !p.stripePriceYearlyId &&
          !p.stripePriceOneTimeId
      )
      .map((p) => p.slug),
    unpriced: products
      .filter(
        (p) =>
          (p.type === 'addon' || p.type === 'license') && !p.defaultPriceCents
      )
      .map((p) => p.slug),
  }
}

async function describeAccount(stripe: Stripe, key: string) {
  const livemode = key.startsWith('sk_live_') || key.startsWith('rk_live_')
  try {
    const account = await stripe.accounts.retrieve()
    return {
      id: account.id,
      name:
        account.business_profile?.name ??
        account.settings?.dashboard?.display_name ??
        null,
      livemode,
    }
  } catch {
    await stripe.balance.retrieve()
    return { id: 'restricted key', name: null, livemode }
  }
}

export async function getStripeSetupStatus(): Promise<StripeSetupStatus> {
  const url = webhookUrl()
  const products = await productStatus()
  const key = await currentKey()
  if (!key) {
    return {
      connected: false,
      webhook: { state: 'missing', url, missingEvents: [] },
      products,
    }
  }

  const stripe = new Stripe(key, { apiVersion: API_VERSION })
  try {
    const account = await describeAccount(stripe, key)
    if (isLocal())
      return {
        connected: true,
        account,
        webhook: { state: 'local', url, missingEvents: [] },
        products,
      }

    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    const endpoint = endpoints.data.find(
      (e) => e.url === url && e.status === 'enabled'
    )
    const hasSecret = !!(await getIntegrations()).stripe?.webhookSecret
    const missingEvents = endpoint
      ? WEBHOOK_EVENTS.filter(
          (e) =>
            !endpoint.enabled_events.includes(e) &&
            !endpoint.enabled_events.includes('*')
        )
      : []
    const state =
      !endpoint || !hasSecret
        ? 'missing'
        : missingEvents.length
          ? 'outdated'
          : 'ok'
    return {
      connected: true,
      account,
      webhook: { state, url, missingEvents },
      products,
    }
  } catch (error) {
    return {
      connected: false,
      webhook: { state: 'missing', url, missingEvents: [] },
      products,
      error: (error as Error).message,
    }
  }
}

export async function runStripeSetup(
  secretKey?: string
): Promise<StripeSetupStatus> {
  const key = secretKey?.trim() || (await currentKey())
  if (!/^(sk|rk)_(live|test)_/.test(key)) {
    throw new Error(
      'Enter a Stripe secret key (sk_live_..., sk_test_...) or restricted key'
    )
  }

  const stripe = new Stripe(key, { apiVersion: API_VERSION })
  await describeAccount(stripe, key)
  if (secretKey) await saveStripe({ secretKey: key })

  if (!isLocal()) {
    const url = webhookUrl()
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    const existing = endpoints.data.find((e) => e.url === url)
    const knownSecret = (await getIntegrations()).stripe?.webhookSecret

    if (existing && knownSecret && !secretKey) {
      await stripe.webhookEndpoints.update(existing.id, {
        enabled_events: WEBHOOK_EVENTS,
        disabled: false,
      })
    } else {
      if (existing) await stripe.webhookEndpoints.del(existing.id)
      const created = await stripe.webhookEndpoints.create({
        url,
        enabled_events: WEBHOOK_EVENTS,
        description: 'Emberly (created automatically)',
        api_version: API_VERSION,
      })
      if (created.secret) await saveStripe({ webhookSecret: created.secret })
    }
  }

  await syncCatalog()
  return getStripeSetupStatus()
}
