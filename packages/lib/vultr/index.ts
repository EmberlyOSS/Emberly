/**
 * Vultr Object Storage API client.
 *
 * Profit architecture:
 *   Admins pre-provision one VultrObjectStorage *instance* per region via the
 *   admin panel.  Each paying user gets their own *bucket* created inside that
 *   shared instance.  Vultr charges per-instance (e.g. $18/mo Standard);
 *   every additional user bucket on the same instance is free, so gross margin
 *   improves with volume: at 2+ users per region the instance is already paid.
 *
 * Auth: Reads from site config (Admin → Integrations → Vultr) with a fallback
 *   to the VULTR_API_KEY environment variable.
 */

import { getIntegrations } from '@/packages/lib/config'

const VULTR_API_BASE = 'https://api.vultr.com/v2'
const VULTR_API_BASE_URL = new URL(VULTR_API_BASE)

function buildVultrApiUrl(path: string): string {
    if (!path.startsWith('/')) {
        throw new Error(`Invalid Vultr API path: "${path}"`)
    }
    if (path.startsWith('//') || path.includes('..') || path.includes('://')) {
        throw new Error(`Unsafe Vultr API path: "${path}"`)
    }

    const url = new URL(path, VULTR_API_BASE_URL)

    if (url.origin !== VULTR_API_BASE_URL.origin) {
        throw new Error(`Unsafe Vultr API URL origin: "${url.origin}"`)
    }

    if (!url.pathname.startsWith('/v2/')) {
        throw new Error(`Unsafe Vultr API URL path: "${url.pathname}"`)
    }

    const lowerPath = url.pathname.toLowerCase()
    if (
        lowerPath.includes('%2e') ||
        lowerPath.includes('%2f') ||
        lowerPath.includes('%5c')
    ) {
        throw new Error(`Unsafe encoded Vultr API path: "${url.pathname}"`)
    }

    return url.toString()
}

async function getApiKey(): Promise<string> {
    const integrations = await getIntegrations()
    const key = integrations?.vultr?.apiKey || process.env.VULTR_API_KEY
    if (!key) throw new Error('Vultr API key is not configured. Set it in Admin → Integrations or via the VULTR_API_KEY environment variable.')
    return key
}

async function vultrRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    body?: unknown,
): Promise<T> {
    const response = await fetch(buildVultrApiUrl(path), {
        method,
        headers: {
            Authorization: `Bearer ${await getApiKey()}`,
            'Content-Type': 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    // 204 No Content — success with no body
    if (response.status === 204) return {} as T

    const text = await response.text()

    if (!response.ok) {
        throw new Error(`Vultr API ${method} ${path} failed (${response.status}): ${text}`)
    }

    return JSON.parse(text) as T
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VultrObjectStorageInstance {
    id: string
    date_created: string
    cluster_id: number
    region: string
    label: string
    status: 'pending' | 'active'
    s3_hostname: string
    s3_access_key: string
    s3_secret_key: string
}

export interface VultrCluster {
    id: number
    region: string
    hostname: string
    deploy: 'yes' | 'no'
}

/** Tier as returned by GET /object-storage/tiers or GET /object-storage/clusters/{id}/tiers */
export interface VultrTier {
    id: number
    sales_name: string
    sales_desc: string
    price: number
    disk_gb_price: number
    bw_gb_price: number
    is_default: 'yes' | 'no'
    slug: string
}

export interface VultrBucket {
    name: string
    date_created: string
    size: number
    object_count: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Object Storage Instances
// ─────────────────────────────────────────────────────────────────────────────

/** List all provisioned Object Storage instances on the Vultr account. */
export async function listObjectStorages(): Promise<VultrObjectStorageInstance[]> {
    const data = await vultrRequest<{ object_storages: VultrObjectStorageInstance[] }>(
        'GET',
        '/object-storage?per_page=500',
    )
    return data.object_storages ?? []
}

/**
 * Provision a new Object Storage instance.
 * @param clusterId - ID from listClusters()
 * @param label     - Human-readable name (e.g. "emberly-ewr-pool")
 * @param tier      - e.g. "standard" | "premium" | "archival" (default: "standard")
 */
export async function createObjectStorage(
    clusterId: number,
    label: string,
    tierId: number,
): Promise<VultrObjectStorageInstance> {
    const data = await vultrRequest<{ object_storage: VultrObjectStorageInstance }>(
        'POST',
        '/object-storage',
        { cluster_id: clusterId, label, tier_id: tierId },
    )
    return data.object_storage
}

/** Get a single provisioned instance by Vultr resource ID. */
export async function getObjectStorage(vultrId: string): Promise<VultrObjectStorageInstance> {
    const data = await vultrRequest<{ object_storage: VultrObjectStorageInstance }>(
        'GET',
        `/object-storage/${vultrId}`,
    )
    return data.object_storage
}

/** Update the label of a provisioned instance. */
export async function updateObjectStorage(vultrId: string, label: string): Promise<void> {
    await vultrRequest<void>('PUT', `/object-storage/${vultrId}`, { label })
}

/**
 * Delete an Object Storage instance.
 * WARNING: Destroys all buckets and objects inside it permanently.
 */
export async function deleteObjectStorage(vultrId: string): Promise<void> {
    await vultrRequest<void>('DELETE', `/object-storage/${vultrId}`)
}

/**
 * Regenerate S3 access/secret keys for an instance.
 * All existing keys are immediately invalidated.
 */
export async function regenerateObjectStorageKeys(
    vultrId: string,
): Promise<{ s3_access_key: string; s3_secret_key: string }> {
    const data = await vultrRequest<{ s3_credentials: { s3_access_key: string; s3_secret_key: string } }>(
        'POST',
        `/object-storage/${vultrId}/regenerate-keys`,
    )
    return data.s3_credentials
}

// ─────────────────────────────────────────────────────────────────────────────
// Buckets (sub-resources within an instance)
// ─────────────────────────────────────────────────────────────────────────────

/** Create a bucket inside a provisioned Object Storage instance. */
export async function createObjectStorageBucket(vultrId: string, bucketName: string): Promise<void> {
    await vultrRequest<void>('POST', `/object-storage/${vultrId}/buckets`, {
        bucket_name: bucketName,
    })
}

/** Delete a bucket and all of its objects inside a provisioned instance. */
export async function deleteObjectStorageBucket(vultrId: string, bucketName: string): Promise<void> {
    await vultrRequest<void>('DELETE', `/object-storage/${vultrId}/buckets/${bucketName}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Clusters & Tiers
// ─────────────────────────────────────────────────────────────────────────────

/** List all available clusters (regions) that support Object Storage. */
export async function listClusters(): Promise<VultrCluster[]> {
    const data = await vultrRequest<{ clusters: VultrCluster[] }>('GET', '/object-storage/clusters')
    return data.clusters ?? []
}

/** List tiers available for a specific cluster. */
export async function listClusterTiers(clusterId: number): Promise<VultrTier[]> {
    if (!Number.isInteger(clusterId)) {
        throw new Error(`Invalid clusterId: ${clusterId}`)
    }

    const data = await vultrRequest<{ tiers: VultrTier[] }>('GET', `/object-storage/clusters/${clusterId}/tiers`)
    return data.tiers ?? []
}

/** List all Vultr regions (superset — useful for label enrichment). */
export async function listRegions(): Promise<Array<{ id: string; city: string; country: string; continent: string }>> {
    const data = await vultrRequest<{ regions: Array<{ id: string; city: string; country: string; continent: string }> }>('GET', '/regions')
    return data.regions ?? []
}

/** List all available storage tiers and their pricing. */
export async function listTiers(): Promise<VultrTier[]> {
    const data = await vultrRequest<{ tiers: VultrTier[] }>('GET', '/object-storage/tiers')
    return data.tiers ?? []
}
