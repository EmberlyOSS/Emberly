/**
 * One-shot DNS setup in a *user's* Cloudflare account.
 *
 * The user's API token is passed in per call and used only for the requests
 * below. It is never persisted, cached, logged or returned — callers must not
 * store it either. Errors are reduced to Cloudflare's error messages so the
 * token can't leak through a thrown object.
 */

import type { RequiredDnsRecord } from '@/packages/lib/domain/dns-records'

const CF_API = 'https://api.cloudflare.com/client/v4'

export class UserCloudflareError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'UserCloudflareError'
  }
}

interface CfEnvelope<T> {
  success: boolean
  errors?: Array<{ code: number; message: string }>
  result: T
}

async function cf<T>(
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${CF_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
  } catch {
    throw new UserCloudflareError('Could not reach Cloudflare', 502)
  }

  const body = (await res.json().catch(() => null)) as CfEnvelope<T> | null
  if (!res.ok || !body?.success) {
    const message =
      body?.errors?.map((e) => e.message).join('; ') ||
      `Cloudflare request failed (${res.status})`
    const status = res.status === 401 || res.status === 403 ? 403 : 502
    throw new UserCloudflareError(message, status)
  }
  return body.result
}

export interface ExistingDnsRecord {
  id: string
  type: string
  name: string
  content: string
}

/**
 * Find the zone in the token's account that contains the hostname, trying
 * each parent (a.b.example.co.uk → b.example.co.uk → example.co.uk → …).
 */
export async function findZoneForHostname(
  token: string,
  hostname: string
): Promise<{ id: string; name: string }> {
  const labels = hostname.toLowerCase().split('.')
  for (let i = 0; i < labels.length - 1; i++) {
    const candidate = labels.slice(i).join('.')
    const zones = await cf<Array<{ id: string; name: string }>>(
      token,
      `/zones?name=${encodeURIComponent(candidate)}`
    )
    if (zones.length > 0) return { id: zones[0].id, name: zones[0].name }
  }
  throw new UserCloudflareError(
    `No Cloudflare zone for ${hostname} is accessible with this token. Make sure the token includes Zone:Read for that zone.`,
    404
  )
}

/** Records at a name that would block creating the given record. */
export async function findConflicts(
  token: string,
  zoneId: string,
  record: RequiredDnsRecord
): Promise<{ matches: boolean; conflicts: ExistingDnsRecord[] }> {
  const existing = await cf<ExistingDnsRecord[]>(
    token,
    `/zones/${zoneId}/dns_records?name=${encodeURIComponent(record.name)}&per_page=100`
  )

  const matches = existing.some(
    (r) =>
      r.type === record.type &&
      r.content.replace(/^"|"$/g, '').toLowerCase() ===
        record.value.toLowerCase()
  )
  if (matches) return { matches: true, conflicts: [] }

  // A CNAME can't share its name with any other record; TXT records only
  // collide with a CNAME at the same name
  const conflicts =
    record.type === 'CNAME'
      ? existing
      : existing.filter((r) => r.type === 'CNAME')
  return { matches: false, conflicts }
}

export async function deleteRecord(
  token: string,
  zoneId: string,
  recordId: string
): Promise<void> {
  await cf(token, `/zones/${zoneId}/dns_records/${recordId}`, {
    method: 'DELETE',
  })
}

export async function createRecord(
  token: string,
  zoneId: string,
  record: RequiredDnsRecord
): Promise<void> {
  await cf(token, `/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body: JSON.stringify({
      type: record.type,
      name: record.name,
      content: record.value,
      ttl: 1,
      // Custom hostnames must resolve straight to our target, not through the
      // user's own Cloudflare proxy
      ...(record.type === 'CNAME' ? { proxied: false } : {}),
      comment: 'Added by Emberly custom domain setup',
    }),
  })
}
