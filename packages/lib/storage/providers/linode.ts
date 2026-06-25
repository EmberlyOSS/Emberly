/**
 * Linode (Akamai Cloud) Object Storage API client.
 *
 * Provisioning model mirrors Vultr:
 *   Admins create a set of Linode access keys for a cluster (region) via the
 *   admin panel.  Each paying user gets their own bucket created in that cluster
 *   using the admin credentials.  Linode charges per GB stored + transfer, so
 *   there is no per-instance fixed cost — margin is purely usage-based.
 *
 * Auth: Reads from site config (Admin → Integrations → Linode) with a fallback
 *   to the LINODE_API_KEY environment variable.
 *
 * API reference: https://techdocs.akamai.com/linode-api/reference/api
 */

import { getIntegrations } from '@/packages/lib/config'

const LINODE_API_BASE = 'https://api.linode.com/v4'
const LINODE_API_BASE_URL = new URL(LINODE_API_BASE)

function buildLinodeApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`Invalid Linode API path: "${path}"`)
  }
  if (path.startsWith('//') || path.includes('..') || path.includes('://')) {
    throw new Error(`Unsafe Linode API path: "${path}"`)
  }

  const url = new URL('/v4' + path, LINODE_API_BASE_URL)

  if (url.origin !== LINODE_API_BASE_URL.origin) {
    throw new Error(`Unsafe Linode API URL origin: "${url.origin}"`)
  }

  const lowerPath = url.pathname.toLowerCase()
  if (
    lowerPath.includes('%2e') ||
    lowerPath.includes('%2f') ||
    lowerPath.includes('%5c')
  ) {
    throw new Error(`Unsafe encoded Linode API path: "${url.pathname}"`)
  }

  return url.toString()
}

async function getApiKey(): Promise<string> {
  const integrations = await getIntegrations()
  const key =
    (integrations as any)?.linode?.apiKey || process.env.LINODE_API_KEY
  if (!key)
    throw new Error(
      'Linode API key is not configured. Set it in Admin → Integrations or via the LINODE_API_KEY environment variable.'
    )
  return key
}

async function linodeRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(buildLinodeApiUrl(path), {
    method,
    headers: {
      Authorization: `Bearer ${await getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // 200/204 with no body
  if (response.status === 200 && response.headers.get('content-length') === '0')
    return {} as T
  if (response.status === 204) return {} as T

  const text = await response.text()

  if (!response.ok) {
    throw new Error(
      `Linode API ${method} ${path} failed (${response.status}): ${text}`
    )
  }

  if (!text) return {} as T
  return JSON.parse(text) as T
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A Linode Object Storage cluster (regional endpoint). */
export interface LinodeCluster {
  /** Cluster ID, e.g. "us-east-1" */
  id: string
  /** Human-readable label, e.g. "Newark, NJ" */
  label: string
  /** Akamai region slug, e.g. "us-east" */
  region: string
  /** S3-compatible endpoint hostname, e.g. "us-east-1.linodeobjects.com" */
  domain: string
  /** Static website endpoint for the cluster */
  static_site_domain: string
  status: 'available' | 'unavailable'
}

/** Pricing plan for Linode Object Storage. */
export interface LinodeStorageType {
  /** Type ID, e.g. "OBJ1200" */
  id: string
  label: string
  /** Monthly price in USD */
  price: { monthly: number | null; hourly: number | null }
  /** Included transfer in bytes */
  transfer: number
  region_prices: Array<{
    id: string
    price: { monthly: number | null; hourly: number | null }
  }>
}

/** A Linode Object Storage access key. */
export interface LinodeObjectStorageKey {
  id: number
  label: string
  access_key: string
  secret_key: string
  /** Whether this key has limited bucket access */
  limited: boolean
  /** Regions and their S3 endpoints that this key is valid for */
  regions: Array<{ id: string; s3_endpoint: string }>
  /** Bucket-level access grants (only present when limited = true) */
  bucket_access: Array<{
    cluster: string
    bucket_name: string
    permissions: 'read_only' | 'read_write'
    region: string
  }> | null
}

/** A Linode Object Storage bucket. */
export interface LinodeBucket {
  /** The cluster (region) ID the bucket lives in, e.g. "us-east-1" */
  cluster: string
  /** Region slug */
  region: string
  /** Bucket creation timestamp */
  created: string
  /** S3 hostname for the bucket, e.g. "my-bucket.us-east-1.linodeobjects.com" */
  hostname: string
  /** Bucket name */
  label: string
  /** Number of objects stored */
  objects: number
  /** Total storage used in bytes */
  size: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Clusters & Plans
// ─────────────────────────────────────────────────────────────────────────────

/** List all available Object Storage clusters (regional endpoints). */
export async function listLinodeClusters(): Promise<LinodeCluster[]> {
  const data = await linodeRequest<{ data: LinodeCluster[] }>(
    'GET',
    '/object-storage/clusters'
  )
  return data.data ?? []
}

/** List available Object Storage pricing plans. */
export async function listLinodeStorageTypes(): Promise<LinodeStorageType[]> {
  const data = await linodeRequest<{ data: LinodeStorageType[] }>(
    'GET',
    '/object-storage/types'
  )
  return data.data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// Access Keys (pool credentials)
// ─────────────────────────────────────────────────────────────────────────────

/** List all Object Storage access keys on the account. */
export async function listLinodeKeys(): Promise<LinodeObjectStorageKey[]> {
  const data = await linodeRequest<{ data: LinodeObjectStorageKey[] }>(
    'GET',
    '/object-storage/keys'
  )
  return data.data ?? []
}

/**
 * Create a new Object Storage access key.
 * To restrict the key to specific buckets, pass bucketAccess.
 * Without bucketAccess the key grants full access to all buckets.
 *
 * @param label        - Human-readable name, e.g. "emberly-us-east-pool"
 * @param bucketAccess - Optional per-bucket restrictions
 * @param regions      - Optional list of region IDs to scope the key to
 */
export async function createLinodeKeys(
  label: string,
  bucketAccess?: Array<{
    cluster: string
    bucket_name: string
    permissions: 'read_only' | 'read_write'
  }>,
  regions?: string[]
): Promise<LinodeObjectStorageKey> {
  const body: Record<string, unknown> = { label }
  if (bucketAccess?.length) body.bucket_access = bucketAccess
  if (regions?.length) body.regions = regions
  return linodeRequest<LinodeObjectStorageKey>(
    'POST',
    '/object-storage/keys',
    body
  )
}

/**
 * Revoke (delete) a Linode Object Storage access key by its numeric ID.
 * All active uploads using this key will fail immediately.
 */
export async function deleteLinodeKeys(keyId: number): Promise<void> {
  if (!Number.isInteger(keyId) || keyId <= 0)
    throw new Error(`Invalid Linode key ID: ${keyId}`)
  await linodeRequest<void>('DELETE', `/object-storage/keys/${keyId}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Buckets
// ─────────────────────────────────────────────────────────────────────────────

/** List all buckets on the account, or optionally filter by cluster. */
export async function listLinodeBuckets(
  clusterId?: string
): Promise<LinodeBucket[]> {
  const data = await linodeRequest<{ data: LinodeBucket[] }>(
    'GET',
    '/object-storage/buckets'
  )
  const buckets = data.data ?? []
  return clusterId ? buckets.filter((b) => b.cluster === clusterId) : buckets
}

/**
 * Create a bucket in the specified cluster.
 *
 * @param clusterId  - e.g. "us-east-1"
 * @param label      - Bucket name (must be unique within the cluster)
 * @param acl        - Access control (default: 'private')
 * @param corsEnabled - Whether to enable CORS (default: false)
 */
export async function createLinodeBucket(
  clusterId: string,
  label: string,
  acl:
    | 'private'
    | 'public-read'
    | 'public-read-write'
    | 'authenticated-read' = 'private',
  corsEnabled = false
): Promise<LinodeBucket> {
  return linodeRequest<LinodeBucket>('POST', '/object-storage/buckets', {
    cluster: clusterId,
    label,
    acl,
    cors_enabled: corsEnabled,
  })
}

/**
 * Delete a bucket and all of its objects.
 * WARNING: Destroys all objects in the bucket permanently.
 *
 * @param clusterId - e.g. "us-east-1"
 * @param label     - Bucket name
 */
export async function deleteLinodeBucket(
  clusterId: string,
  label: string
): Promise<void> {
  await linodeRequest<void>(
    'DELETE',
    `/object-storage/buckets/${clusterId}/${label}`
  )
}

/** Get details for a single bucket. */
export async function getLinodeBucket(
  clusterId: string,
  label: string
): Promise<LinodeBucket> {
  return linodeRequest<LinodeBucket>(
    'GET',
    `/object-storage/buckets/${clusterId}/${label}`
  )
}
