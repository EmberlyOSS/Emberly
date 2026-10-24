import { createPublicKey, verify } from 'node:crypto'

import { appUrl } from '@/lib/config/app-url'

import { DEFAULT_KEY_ID, LICENSE_PUBLIC_KEYS } from './public-key'

export const LICENSE_PREFIX = 'emb_lic_'

export type LicenseFeature = 'white-label' | 'cloud' | 'vendor'

export interface LicensePayload {
  v: 1
  kid?: string
  id: string
  licensee: string
  features: LicenseFeature[]
  domains?: string[]
  issuedAt: string
  expiresAt?: string
}

export type LicenseStatus =
  | { state: 'none' }
  | { state: 'invalid'; reason: string }
  | {
      state: 'expired' | 'wrong-domain' | 'revoked' | 'valid'
      license: LicensePayload
    }

// Kept on globalThis so the proxy, which is bundled separately, sees the
// same license as the rest of the app
interface LicenseState {
  revoked: Set<string>
  stored: string | null
  refreshed: string | null
  cached: { key: string; status: LicenseStatus; day: string } | null
}

const g = globalThis as typeof globalThis & { __emberlyLicense?: LicenseState }
const state: LicenseState = (g.__emberlyLicense ??= {
  revoked: new Set(),
  stored: null,
  refreshed: null,
  cached: null,
})

export function setRevokedLicenseIds(ids: string[]) {
  state.revoked = new Set(ids)
  state.cached = null
}

function hostMatches(host: string, pattern: string) {
  const p = pattern.toLowerCase()
  return p.startsWith('*.') ? host.endsWith(p.slice(1)) : host === p
}

export function parseLicense(
  key: string,
  {
    now = new Date(),
    checkDomain = true,
  }: { now?: Date; checkDomain?: boolean } = {}
): LicenseStatus {
  if (!key.startsWith(LICENSE_PREFIX)) {
    return { state: 'invalid', reason: 'Not an Emberly license key' }
  }
  const [body, signature] = key.slice(LICENSE_PREFIX.length).split('.')
  if (!body || !signature) return { state: 'invalid', reason: 'Malformed key' }

  let license: LicensePayload
  try {
    license = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return { state: 'invalid', reason: 'Unreadable key' }
  }

  const publicKey = LICENSE_PUBLIC_KEYS[license.kid ?? DEFAULT_KEY_ID]
  let valid = false
  try {
    valid =
      !!publicKey &&
      verify(
        null,
        Buffer.from(body),
        createPublicKey(publicKey),
        Buffer.from(signature, 'base64url')
      )
  } catch {
    valid = false
  }
  if (!valid) return { state: 'invalid', reason: 'Signature does not match' }
  if (license.v !== 1)
    return { state: 'invalid', reason: 'Unsupported key version' }
  if (state.revoked.has(license.id)) return { state: 'revoked', license }

  if (license.expiresAt && new Date(license.expiresAt) < now) {
    return { state: 'expired', license }
  }

  if (checkDomain && license.domains?.length) {
    const host = new URL(appUrl()).hostname.toLowerCase()
    const local = host === 'localhost' || host === '127.0.0.1'
    if (!local && !license.domains.some((d) => hostMatches(host, d))) {
      return { state: 'wrong-domain', license }
    }
  }

  return { state: 'valid', license }
}

const envLicenseKey = () => process.env.EMBERLY_LICENSE_KEY?.trim() || null

/** Where the license key comes from: the environment wins over settings. */
export function licenseKeySource(): 'env' | 'settings' | null {
  if (envLicenseKey()) return 'env'
  return state.stored ? 'settings' : null
}

const baseLicenseKey = () => envLicenseKey() ?? state.stored

const licenseId = (key: string | null) => {
  const parsed = key ? parseLicense(key, { checkDomain: false }) : null
  return parsed && 'license' in parsed ? parsed.license.id : null
}

export function currentLicenseKey() {
  return state.refreshed ?? baseLicenseKey()
}

/** Sets the key entered in the admin panel, or clears it with null. */
export function setStoredLicenseKey(key: string | null) {
  state.stored = key
  if (licenseId(state.refreshed) !== licenseId(baseLicenseKey())) {
    state.refreshed = null
    state.revoked = new Set()
  }
  state.cached = null
}

/** Accepts a renewed key from a check-in, only for the license in use. */
export function setRefreshedLicenseKey(key: string) {
  const id = licenseId(key)
  if (!id || id !== licenseId(baseLicenseKey())) return false
  state.refreshed = key
  state.cached = null
  return true
}

export function getLicense(): LicenseStatus {
  const key = currentLicenseKey()
  if (!key) return { state: 'none' }
  const day = new Date().toISOString().slice(0, 10)
  if (state.cached?.key !== key || state.cached.day !== day) {
    state.cached = { key, status: parseLicense(key), day }
  }
  return state.cached.status
}

export function hasLicenseFeature(feature: LicenseFeature) {
  const status = getLicense()
  return status.state === 'valid' && status.license.features.includes(feature)
}
