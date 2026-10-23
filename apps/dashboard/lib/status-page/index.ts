/**
 * Read-only client for the Emberly status page (emberly-status).
 *
 * The status page publishes a small snapshot at /api/status/summary. We fetch
 * it server-side with a short timeout and cache it, so visitors never call
 * the status page directly and a slow status page can't slow Emberly down.
 */
import { isCloudEnabled } from '@/lib/config/env'
import { loggers } from '@/lib/logger'

const logger = loggers.api.getChildLogger('status-page')

export type StatusIndicator = 'NONE' | 'MINOR' | 'MAJOR' | 'CRITICAL'

export interface StatusSnapshot {
  /** Public URL of the status page */
  url: string
  indicator: StatusIndicator | 'UNKNOWN'
  description: string
  maintenance: boolean
  /** The most recent unresolved incident, if any */
  incident: { name: string; url: string } | null
}

interface SummaryResponse {
  status: {
    indicator: StatusIndicator
    description: string
    maintenance?: boolean
  }
  incidents: { name: string; url: string }[]
}

const CACHE_MS = 30_000
const TIMEOUT_MS = 4_000

let cache: { at: number; value: StatusSnapshot } | null = null

/**
 * The status page URL, or null when none is configured. Hosted Emberly
 * defaults to emberlystat.us; self-hosted instances opt in with STATUS_PAGE_URL.
 */
export function getStatusPageUrl(): string | null {
  const url =
    process.env.STATUS_PAGE_URL ||
    (isCloudEnabled() ? 'https://emberlystat.us' : '')
  return url ? url.replace(/\/$/, '') : null
}

export async function getStatusSnapshot(): Promise<StatusSnapshot | null> {
  const url = getStatusPageUrl()
  if (!url) return null

  if (cache && cache.value.url === url && Date.now() - cache.at < CACHE_MS) {
    return cache.value
  }

  let value: StatusSnapshot
  try {
    const res = await fetch(`${url}/api/status/summary`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as SummaryResponse
    value = {
      url,
      indicator: data.status.indicator,
      description: data.status.description,
      maintenance: Boolean(data.status.maintenance),
      incident: data.incidents[0]
        ? { name: data.incidents[0].name, url: data.incidents[0].url }
        : null,
    }
  } catch (error) {
    logger.warn('Could not fetch status page summary', {
      url,
      error: error instanceof Error ? error.message : String(error),
    })
    // Keep serving the last good value briefly rather than flapping to "unknown"
    if (
      cache &&
      cache.value.url === url &&
      Date.now() - cache.at < CACHE_MS * 4
    ) {
      return cache.value
    }
    value = {
      url,
      indicator: 'UNKNOWN',
      description: 'Status unavailable',
      maintenance: false,
      incident: null,
    }
  }

  cache = { at: Date.now(), value }
  return value
}
