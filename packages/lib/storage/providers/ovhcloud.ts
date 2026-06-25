/**
 * OVHcloud Public Cloud Object Storage API client.
 *
 * Provisioning model mirrors Vultr/Linode:
 *   Admins register a Public Cloud project and generate S3-compatible
 *   credentials for a chosen region.  Each paying user gets their own
 *   container (bucket) provisioned in that region.  OVHcloud charges per
 *   GB stored + outbound transfer.
 *
 * Auth: Uses OVHcloud's 4-key scheme (appKey, appSecret, consumerKey,
 *   endpoint) with HMAC-SHA1 request signing.  Reads from site config
 *   (Admin → Integrations → OVHcloud) with fallback to environment
 *   variables OVH_APP_KEY, OVH_APP_SECRET, OVH_CONSUMER_KEY, OVH_ENDPOINT.
 *
 * API reference: https://api.eu.ovhcloud.com/console/?section=%2FpublicCloud&branch=v2
 */

import { createHash } from 'crypto'
import { getIntegrations } from '@/packages/lib/config'

// OVH endpoint base URLs keyed by endpoint name
const OVH_ENDPOINTS: Record<string, string> = {
  'ovh-eu': 'https://eu.api.ovh.com/v2',
  'ovh-us': 'https://api.us.ovhcloud.com/v2',
  'ovh-ca': 'https://ca.api.ovh.com/v2',
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth / request internals
// ─────────────────────────────────────────────────────────────────────────────

interface OVHCredentials {
  appKey: string
  appSecret: string
  consumerKey: string
  endpoint: string
  baseUrl: string
}

async function getCredentials(): Promise<OVHCredentials> {
  const integrations = await getIntegrations()
  const ovh = (integrations as any)?.ovhcloud ?? {}

  const appKey = ovh.appKey || process.env.OVH_APP_KEY || ''
  const appSecret = ovh.appSecret || process.env.OVH_APP_SECRET || ''
  const consumerKey = ovh.consumerKey || process.env.OVH_CONSUMER_KEY || ''
  const endpoint = ovh.endpoint || process.env.OVH_ENDPOINT || 'ovh-eu'

  if (!appKey || !appSecret || !consumerKey) {
    throw new Error(
      'OVHcloud credentials are not configured. Set them in Admin → Integrations or via OVH_APP_KEY, OVH_APP_SECRET, OVH_CONSUMER_KEY environment variables.'
    )
  }

  const baseUrl = OVH_ENDPOINTS[endpoint]
  if (!baseUrl) {
    throw new Error(
      `Unknown OVH endpoint "${endpoint}". Valid values: ${Object.keys(OVH_ENDPOINTS).join(', ')}`
    )
  }

  return { appKey, appSecret, consumerKey, endpoint, baseUrl }
}

function signOVHRequest(
  appSecret: string,
  consumerKey: string,
  method: string,
  url: string,
  body: string,
  timestamp: number
): string {
  const toSign = [
    appSecret,
    consumerKey,
    method.toUpperCase(),
    url,
    body,
    String(timestamp),
  ].join('+')
  return '$1$' + createHash('sha1').update(toSign).digest('hex')
}

async function ovhRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const creds = await getCredentials()

  if (!path.startsWith('/')) throw new Error(`Invalid OVH API path: "${path}"`)
  if (path.includes('..') || path.includes('://'))
    throw new Error(`Unsafe OVH API path: "${path}"`)

  const url = `${creds.baseUrl}${path}`
  const bodyStr = body !== undefined ? JSON.stringify(body) : ''
  const timestamp = Math.round(Date.now() / 1000)

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Ovh-Application': creds.appKey,
      'X-Ovh-Consumer': creds.consumerKey,
      'X-Ovh-Timestamp': String(timestamp),
      'X-Ovh-Signature': signOVHRequest(
        creds.appSecret,
        creds.consumerKey,
        method,
        url,
        bodyStr,
        timestamp
      ),
    },
    body: bodyStr || undefined,
  })

  if (response.status === 204) return {} as T

  const text = await response.text()

  if (!response.ok) {
    throw new Error(
      `OVHcloud API ${method} ${path} failed (${response.status}): ${text}`
    )
  }

  if (!text) return {} as T
  return JSON.parse(text) as T
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** An OVHcloud Public Cloud project. */
export interface OVHProject {
  id: string
  description: string
  status: 'creating' | 'ok' | 'suspended' | 'deleting'
  unleash: boolean
}

/** An OVHcloud region detail. */
export interface OVHRegion {
  name: string
  status: 'UP' | 'DOWN' | 'MAINTENANCE'
  services: Array<{ name: string; status: 'UP' | 'DOWN' }>
  ipCountries: string[]
  continentCode: string
  datacenterLocation: string
}

/** OVHcloud Object Storage storage policy classes. */
export type OVHStoragePolicyClass = 'standard' | 'high_performance'

/** An OVHcloud Object Storage container (equivalent to a bucket). */
export interface OVHStorageContainer {
  id: string
  name: string
  storedObjects: number
  storedBytes: number
  region: string
  storagePolicyClass: OVHStoragePolicyClass
  /** Public S3 virtual-hosted endpoint for this container */
  virtualHost: string
  s3StorageType: string | null
}

/** S3-compatible credentials for a Public Cloud project. */
export interface OVHStorageCredentials {
  /** S3 access key */
  access: string
  /** S3 secret key */
  secret: string
  /** OVHcloud user ID these credentials belong to */
  userId: string
  /** OpenStack tenant ID */
  tenantId: string
}

/** Storage pricing entry from the OVH product catalog. */
export interface OVHStoragePlan {
  /** Plan code, e.g. "storage.s3.standard.gb.hour.consumption" */
  planCode: string
  invoiceName: string
  price: {
    currencyCode: string
    text: string
    value: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────────

/** List all Public Cloud projects accessible to the authenticated account. */
export async function listOVHProjects(): Promise<OVHProject[]> {
  return ovhRequest<OVHProject[]>('GET', '/cloud/project')
}

/** Get details for a single Public Cloud project. */
export async function getOVHProject(projectId: string): Promise<OVHProject> {
  return ovhRequest<OVHProject>(
    'GET',
    `/cloud/project/${encodeURIComponent(projectId)}`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Regions
// ─────────────────────────────────────────────────────────────────────────────

/** List all regions enabled for a Public Cloud project. */
export async function listOVHRegions(projectId: string): Promise<OVHRegion[]> {
  return ovhRequest<OVHRegion[]>(
    'GET',
    `/cloud/project/${encodeURIComponent(projectId)}/region`
  )
}

/** Get details for a single region. */
export async function getOVHRegion(
  projectId: string,
  regionName: string
): Promise<OVHRegion> {
  return ovhRequest<OVHRegion>(
    'GET',
    `/cloud/project/${encodeURIComponent(projectId)}/region/${encodeURIComponent(regionName)}`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage Containers (Buckets)
// ─────────────────────────────────────────────────────────────────────────────

/** List all Object Storage containers in a project+region. */
export async function listOVHStorageContainers(
  projectId: string,
  regionName: string
): Promise<OVHStorageContainer[]> {
  return ovhRequest<OVHStorageContainer[]>(
    'GET',
    `/cloud/project/${encodeURIComponent(projectId)}/region/${encodeURIComponent(regionName)}/storage`
  )
}

/**
 * Create an Object Storage container (bucket) in a project+region.
 *
 * @param projectId        - OVH project/service name
 * @param regionName       - OVH region, e.g. "GRA" | "BHS" | "SBG"
 * @param name             - Container name
 * @param storagePolicyClass - Storage tier (default: 'standard')
 */
export async function createOVHStorageContainer(
  projectId: string,
  regionName: string,
  name: string,
  storagePolicyClass: OVHStoragePolicyClass = 'standard'
): Promise<OVHStorageContainer> {
  return ovhRequest<OVHStorageContainer>(
    'POST',
    `/cloud/project/${encodeURIComponent(projectId)}/region/${encodeURIComponent(regionName)}/storage`,
    { name, storagePolicyClass }
  )
}

/**
 * Delete an Object Storage container and all objects within it.
 * WARNING: This is permanent and cannot be undone.
 */
export async function deleteOVHStorageContainer(
  projectId: string,
  regionName: string,
  name: string
): Promise<void> {
  await ovhRequest<void>(
    'DELETE',
    `/cloud/project/${encodeURIComponent(projectId)}/region/${encodeURIComponent(regionName)}/storage/${encodeURIComponent(name)}`
  )
}

/** Get details for a single Object Storage container. */
export async function getOVHStorageContainer(
  projectId: string,
  regionName: string,
  name: string
): Promise<OVHStorageContainer> {
  return ovhRequest<OVHStorageContainer>(
    'GET',
    `/cloud/project/${encodeURIComponent(projectId)}/region/${encodeURIComponent(regionName)}/storage/${encodeURIComponent(name)}`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// S3 Credentials
// ─────────────────────────────────────────────────────────────────────────────

/** List all S3-compatible credentials for a project. */
export async function listOVHStorageCredentials(
  projectId: string
): Promise<OVHStorageCredentials[]> {
  return ovhRequest<OVHStorageCredentials[]>(
    'GET',
    `/cloud/project/${encodeURIComponent(projectId)}/s3Credentials`
  )
}

/**
 * Generate a new set of S3-compatible credentials for a project.
 * The secret key is only returned once — store it immediately.
 */
export async function createOVHStorageCredentials(
  projectId: string
): Promise<OVHStorageCredentials> {
  return ovhRequest<OVHStorageCredentials>(
    'POST',
    `/cloud/project/${encodeURIComponent(projectId)}/s3Credentials`
  )
}

/**
 * Revoke (delete) a set of S3 credentials by access key.
 * All active uploads using this key will fail immediately.
 */
export async function deleteOVHStorageCredentials(
  projectId: string,
  accessKey: string
): Promise<void> {
  await ovhRequest<void>(
    'DELETE',
    `/cloud/project/${encodeURIComponent(projectId)}/s3Credentials/${encodeURIComponent(accessKey)}`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing / Plans
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch OVHcloud Object Storage pricing plans from the public catalog.
 * Filtered to storage-related plan codes.
 *
 * @param subsidiary - OVH subsidiary code, e.g. "IE", "FR", "US" (default: "IE")
 */
export async function listOVHStoragePlans(
  subsidiary = 'IE'
): Promise<OVHStoragePlan[]> {
  type CatalogPlan = {
    planCode: string
    invoiceName: string
    pricings: Array<{ price: number; currencyCode: string; text: string }>
  }
  type Catalog = { plans: CatalogPlan[] }

  const catalog = await ovhRequest<Catalog>(
    'GET',
    `/order/catalog/public/cloud?ovhSubsidiary=${encodeURIComponent(subsidiary)}`
  )

  return (catalog.plans ?? [])
    .filter((p) => /storage|object/i.test(p.planCode))
    .map((p) => ({
      planCode: p.planCode,
      invoiceName: p.invoiceName,
      price: p.pricings?.[0]
        ? {
            currencyCode: p.pricings[0].currencyCode,
            text: p.pricings[0].text,
            value: p.pricings[0].price,
          }
        : { currencyCode: 'EUR', text: '0', value: 0 },
    }))
}
