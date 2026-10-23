const TRUTHY_VALUES = new Set(['1', 'true', 'yes'])
const warned = new Set<string>()

function read(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function readWithLegacy(name: string, legacy: string[]): string | undefined {
  const value = read(name)
  if (value) return value
  for (const old of legacy) {
    const legacyValue = read(old)
    if (!legacyValue) continue
    if (!warned.has(old)) {
      warned.add(old)
      console.warn(`[emberly] ${old} is deprecated, set ${name} instead`)
    }
    return legacyValue
  }
  return undefined
}

export function appUrl(): string {
  const configured = readWithLegacy('APP_URL', [
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_APP_URL',
    'APP_BASE_URL',
  ])
  const url = configured ?? `http://localhost:${read('PORT') ?? '3000'}`
  return url.replace(/\/+$/, '')
}

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
  TRUTHY_VALUES.has((read('EMBERLY_RUN_CLOUD') ?? '').toLowerCase())

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
