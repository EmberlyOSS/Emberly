import { hasLicenseFeature } from '@/lib/license'

import { appUrl, read, readWithLegacy } from './app-url'

export { appUrl }

const TRUTHY_VALUES = new Set(['1', 'true', 'yes'])

export function authSecret(): string | undefined {
  return readWithLegacy('AUTH_SECRET', ['NEXTAUTH_SECRET'])
}

export function stripeSecretKey(): string | undefined {
  return readWithLegacy('STRIPE_SECRET_KEY', ['STRIPE_SECRET'])
}

export function stripeWebhookSecret(): string | undefined {
  return readWithLegacy('STRIPE_WEBHOOK_SECRET', ['STRIPE_WEBHOOK'])
}

export const isCloudEnabled = () =>
  TRUTHY_VALUES.has((read('EMBERLY_RUN_CLOUD') ?? '').toLowerCase()) &&
  hasLicenseFeature('cloud')

export const env = {
  get GITHUB_OAUTH_CLIENT_ID() {
    return read('GITHUB_OAUTH_CLIENT_ID') ?? ''
  },
  get GITHUB_OAUTH_CLIENT_SECRET() {
    return read('GITHUB_OAUTH_CLIENT_SECRET') ?? ''
  },
  get DISCORD_OAUTH_CLIENT_ID() {
    return read('DISCORD_OAUTH_CLIENT_ID') ?? ''
  },
  get DISCORD_OAUTH_CLIENT_SECRET() {
    return read('DISCORD_OAUTH_CLIENT_SECRET') ?? ''
  },
}
