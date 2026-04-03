/**
 * Instatus API Client
 * Wrapper for fetching data from Instatus public and authenticated API endpoints
 * 
 * Public API: https://status.emberly.site (no auth required)
 * Private API: https://api.instatus.com (requires API key)
 * 
 * Set these environment variables for authenticated access:
 * - INSTATUS_API_KEY: Bearer token from User settings → Developer settings
 * - INSTATUS_PAGE_ID: Found in dashboard via code mode (<> button)
 */

import { cache } from 'react'

import {
    StatusSummary,
    StatusComponent,
    Incident,
    Maintenance,
    EmberlyStatusResponse,
} from '@/packages/types/instatus'
import { logger } from '@/packages/lib/logger'

// Base URLs
const PUBLIC_BASE_URL = process.env.INSTATUS_STATUS_URL || 'https://status.emberly.site'
const API_BASE_URL = 'https://api.instatus.com'

// Credentials for authenticated API
const API_KEY = process.env.INSTATUS_API_KEY
const PAGE_ID = process.env.INSTATUS_PAGE_ID

// Cache duration in seconds (1 minute for status data)
const CACHE_TTL = 60

interface FetchOptions {
    revalidate?: number
    tags?: string[]
    useAuth?: boolean
}

/**
 * Check if authenticated API is available
 */
export function hasAuthenticatedAccess(): boolean {
    return Boolean(API_KEY && PAGE_ID)
}

/**
 * Generic fetch helper for public endpoints (no auth)
 */
async function fetchPublic<T>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T | null> {
    const url = `${PUBLIC_BASE_URL}${endpoint}`

    try {
        const res = await fetch(url, {
            next: {
                revalidate: options.revalidate ?? CACHE_TTL,
                tags: options.tags ?? ['status'],
            },
        })

        if (!res.ok) {
            logger.error(`Instatus public API error: ${res.status} ${res.statusText}`, {
                url,
                status: res.status,
            })
            return null
        }

        return await res.json()
    } catch (error) {
        logger.error('Failed to fetch from Instatus public API', {
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
        })
        return null
    }
}

/**
 * Generic fetch helper for authenticated API endpoints
 */
async function fetchAPI<T>(
    endpoint: string,
    options: FetchOptions & { method?: string; body?: unknown } = {}
): Promise<T | null> {
    if (!API_KEY) {
        logger.warn('Instatus API key not configured, falling back to public API')
        return null
    }

    const url = `${API_BASE_URL}${endpoint}`

    try {
        const res = await fetch(url, {
            method: options.method || 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            next: {
                revalidate: options.revalidate ?? CACHE_TTL,
                tags: options.tags ?? ['status'],
            },
        })

        if (!res.ok) {
            logger.error(`Instatus API error: ${res.status} ${res.statusText}`, {
                url,
                status: res.status,
            })
            return null
        }

        return await res.json()
    } catch (error) {
        logger.error('Failed to fetch from Instatus API', {
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
        })
        return null
    }
}

/**
 * Get overall status summary
 * Uses public endpoint: /summary.json
 */
export const getStatusSummary = cache(async (): Promise<StatusSummary | null> => {
    const raw = await fetchPublic<StatusSummary>('/summary.json')

    if (!raw) return null

    // Instatus returns page.status as 'UP' | 'HASISSUES' | 'UNDERMAINTENANCE'.
    // Ensure the value is one of our known StatusType values, defaulting to UNKNOWN.
    const RAW_STATUS_VALUES: StatusSummary['page']['status'][] = [
        'UP', 'HASISSUES', 'UNDERMAINTENANCE', 'DOWN', 'DEGRADED', 'UNKNOWN',
    ]
    const rawStatus = raw.page?.status as string | undefined
    const normalizedStatus: StatusSummary['page']['status'] =
        rawStatus && RAW_STATUS_VALUES.includes(rawStatus as any)
            ? (rawStatus as StatusSummary['page']['status'])
            : 'UNKNOWN'

    return {
        page: {
            ...(raw.page ?? {}),
            name: raw.page?.name ?? 'Emberly',
            url: raw.page?.url ?? 'https://status.emberly.site',
            status: normalizedStatus,
        },
        activeIncidents: raw.activeIncidents ?? [],
        activeMaintenances: raw.activeMaintenances ?? [],
    }
})

/**
 * Get all components with their current status
 * Uses public endpoint: /v2/components.json
 */
export const getStatusComponents = cache(async (): Promise<StatusComponent[]> => {
    const raw = await fetchPublic<StatusComponent[] | { components: StatusComponent[] }>('/v2/components.json')
    
    if (!raw) return []
    
    // Handle both array response and object with components property
    if (Array.isArray(raw)) {
        return raw
    }
    
    if (raw && typeof raw === 'object' && 'components' in raw && Array.isArray(raw.components)) {
        return raw.components
    }
    
    return []
})

/**
 * Get incident history
 * Uses authenticated API if available, falls back to public endpoint
 */
export const getIncidents = cache(async (): Promise<Incident[]> => {
    // Try authenticated API first for full incident data
    if (hasAuthenticatedAccess()) {
        const response = await fetchAPI<Incident[] | { incidents: Incident[] }>(`/v1/${PAGE_ID}/incidents`, {
            revalidate: 300,
        })
        if (response) {
            if (Array.isArray(response)) return response
            if (typeof response === 'object' && 'incidents' in response && Array.isArray(response.incidents)) {
                return response.incidents
            }
        }
    }

    // Fall back to public endpoint
    const incidents = await fetchPublic<Incident[] | { incidents: Incident[] }>('/v2/incidents.json', {
        revalidate: 300,
    })

    if (!incidents) return []
    if (Array.isArray(incidents)) return incidents
    if (typeof incidents === 'object' && 'incidents' in incidents && Array.isArray(incidents.incidents)) {
        return incidents.incidents
    }
    
    return []
})

/**
 * Get scheduled maintenances
 * Uses authenticated API if available, falls back to public endpoint
 */
export const getMaintenances = cache(async (): Promise<Maintenance[]> => {
    // Try authenticated API first for full maintenance data
    if (hasAuthenticatedAccess()) {
        const response = await fetchAPI<Maintenance[] | { maintenances: Maintenance[] }>(`/v2/${PAGE_ID}/maintenances`, {
            revalidate: 300,
        })
        if (response) {
            if (Array.isArray(response)) return response
            if (typeof response === 'object' && 'maintenances' in response && Array.isArray(response.maintenances)) {
                return response.maintenances
            }
        }
    }

    // Fall back to public endpoint
    const maintenances = await fetchPublic<Maintenance[] | { maintenances: Maintenance[] }>('/v2/maintenances.json', {
        revalidate: 300,
    })

    if (!maintenances) return []
    if (Array.isArray(maintenances)) return maintenances
    if (typeof maintenances === 'object' && 'maintenances' in maintenances && Array.isArray(maintenances.maintenances)) {
        return maintenances.maintenances
    }

    return []
})

/**
 * Get aggregated status data for the status page
 * Combines summary, components, incidents, and maintenances
 */
export async function getFullStatusData(): Promise<EmberlyStatusResponse | null> {
    try {
        // Fetch all data in parallel
        const [summary, components, incidents, maintenances] = await Promise.all([
            getStatusSummary(),
            getStatusComponents(),
            getIncidents(),
            getMaintenances(),
        ])

        if (!summary) {
            logger.warn('Failed to fetch status summary')
            return null
        }

        return {
            status: summary.page.status,
            summary,
            components,
            incidents,
            maintenances,
            lastUpdated: new Date().toISOString(),
        }
    } catch (error) {
        logger.error('Failed to get full status data', {
            error: error instanceof Error ? error.message : 'Unknown error',
        })
        return null
    }
}

/**
 * Calculate uptime percentage from component history
 * Note: This is an estimate based on current status if historical data isn't available
 */
export function calculateUptime(
    _componentId: string,
    _days: number = 90
): number {
    // In a real implementation, this would query historical data
    // For now, return a placeholder that can be enhanced later
    return 99.9
}

/**
 * Check if there are any active issues
 */
export function hasActiveIssues(summary: StatusSummary): boolean {
    return (
        summary.activeIncidents.length > 0 ||
        summary.activeMaintenances.length > 0
    )
}

/**
 * Get the most severe status from a list of components
 */
export function getMostSevereStatus(
    components: StatusComponent[]
): StatusComponent['status'] {
    const severityOrder: StatusComponent['status'][] = [
        'MAJOROUTAGE',
        'PARTIALOUTAGE',
        'DEGRADEDPERFORMANCE',
        'UNDERMAINTENANCE',
        'OPERATIONAL',
    ]

    for (const severity of severityOrder) {
        if (components.some(c => c.status === severity)) {
            return severity
        }
    }

    return 'OPERATIONAL'
}

/**
 * Group components by their parent/group
 */
export function groupComponents(
    components: StatusComponent[]
): Map<string | null, StatusComponent[]> {
    const groups = new Map<string | null, StatusComponent[]>()

    for (const component of components) {
        const groupId = component.group?.id ?? null

        if (!groups.has(groupId)) {
            groups.set(groupId, [])
        }

        groups.get(groupId)!.push(component)
    }

    return groups
}

/**
 * Format relative time for incident/maintenance timestamps
 */
export function formatRelativeTime(date: string): string {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return then.toLocaleDateString()
}
