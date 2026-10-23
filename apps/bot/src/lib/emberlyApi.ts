/**
 * Client for the Emberly API.
 * Each method takes the user's own uploadToken (or an ebk_ API key) as a
 * Bearer credential — no privileged system key required. Users link their
 * token via /link.
 */

const BASE = process.env.EMBERLY_API_URL?.replace(/\/$/, '') ?? 'https://embrly.ca'

const TIMEOUT_MS = 10_000

/** Thrown when Emberly rejects the stored token (revoked or regenerated). */
export class EmberlyAuthError extends Error {
  constructor() {
    super('Your Emberly token is no longer valid')
    this.name = 'EmberlyAuthError'
  }
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch (err) {
    if ((err as Error)?.name === 'TimeoutError') {
      throw new Error('Emberly took too long to respond. Please try again in a moment.')
    }
    throw new Error('Could not reach Emberly. Please try again in a moment.')
  }

  if (res.status === 401) throw new EmberlyAuthError()

  // Error pages from the proxy (502s etc.) aren't JSON, so don't assume a body
  const json = (await res.json().catch(() => null)) as { error?: string } | null
  if (!res.ok) throw new Error(json?.error ?? `Emberly returned an error (${res.status}).`)
  if (json === null) throw new Error('Emberly returned an unexpected response.')
  return json as T
}

function get<T>(token: string, path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return request<T>(url.toString(), { headers: authHeaders(token) })
}

function post<T>(token: string, path: string, body: object): Promise<T> {
  return request<T>(`${BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
}

// ── Response shape types (matching real site API) ─────────────────────────

export interface ProfileData {
  id: string
  name: string | null
  image: string | null
  urlId: string
  vanityId: string | null
  createdAt: string
}

export interface AnalyticsSummary {
  plan: string
  basic: {
    totalFiles: number
    storageUsed: number        // MB
    totalUrls: number
    totalUrlClicks: number
    totalViews: number
    totalDownloads: number
    domainsCount: number
    verifiedDomains: number
  }
  allowed: { topFiles: boolean; topUrls: boolean; recentUploads: boolean; detailedList: boolean }
  recentUploads?: Array<{ id: string; name: string; size: number; uploadedAt: string; views: number; downloads: number }>
}

export interface FileItem {
  id: string
  name: string
  urlPath: string              // starts with "/"
  mimeType: string
  size: number
  visibility: string
  uploadedAt: string
  views: number
  downloads: number
  hasPassword: boolean
  user: { urlId: string }
}

export interface DomainItem {
  id: string
  domain: string
  verified: boolean
  isPrimary: boolean
  cfStatus: string | null
  createdAt: string
}

export interface ShortenedUrl {
  shortCode: string
  targetUrl: string
}

export interface SquadItem {
  id: string
  name: string
  slug: string
  tagline: string | null
  status: string
  isPublic: boolean
  isVerified: boolean
  maxSize: number
  storageUsed: number          // MB
  storageQuotaMB: number | null
  _count: { members: number }
  myRole: string
}

// ── API methods ────────────────────────────────────────────────────────────

export const emberlyApi = {
  /** Validate a token and fetch the user's identity fields */
  validateToken: (token: string) =>
    get<{ data: ProfileData; success: true }>(token, '/api/profile'),

  /** GET /api/profile → profile identity fields */
  getProfile: (token: string) =>
    get<{ data: ProfileData; success: true }>(token, '/api/profile'),

  /** GET /api/analytics/summary → upload/sharing stats */
  getAnalytics: (token: string) =>
    get<AnalyticsSummary>(token, '/api/analytics/summary'),

  /** GET /api/files?limit=N&sortBy=newest → recent files */
  getFiles: (token: string, limit = 5) =>
    get<{ data: FileItem[]; pagination: { total: number }; success: true }>(token, '/api/files', {
      limit: String(limit),
      sortBy: 'newest',
    }),

  /** GET /api/domains → custom domains + limit info */
  getDomains: (token: string) =>
    get<{ domains: DomainItem[] }>(token, '/api/domains'),

  /** POST /api/urls → shorten a URL */
  shorten: (token: string, url: string) =>
    post<{ data: ShortenedUrl; success: true }>(token, '/api/urls', { url }),

  /** GET /api/discovery/squads?mine=true → all squads the user belongs to */
  getSquads: (token: string) =>
    get<{ data: { squads: SquadItem[] }; success: true }>(token, '/api/discovery/squads', { mine: 'true' }),

  /**
   * GET /api/profile/sharex → the user's ShareX config, built by the site so
   * it respects their preferred upload domain.
   */
  getShareXConfig: (token: string) =>
    get<Record<string, unknown>>(token, '/api/profile/sharex'),

}
