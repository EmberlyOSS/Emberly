/**
 * DNS records a user must create for a custom domain.
 *
 * Built server-side from the Cloudflare custom-hostname object so the UI and
 * the automatic Cloudflare setup always agree on exactly what is required.
 */

export interface RequiredDnsRecord {
  type: 'CNAME' | 'TXT'
  /** Fully qualified record name, e.g. files.example.com */
  name: string
  value: string
  purpose: 'routing' | 'ownership' | 'certificate'
}

export function getCnameTarget(): string {
  return process.env.CNAME_TARGET || 'cname.emberly.site'
}

interface TxtLike {
  type?: string
  name?: string
  txt_name?: string
  value?: string
  txt_value?: string
}

function toTxt(
  r: TxtLike | undefined,
  purpose: RequiredDnsRecord['purpose']
): RequiredDnsRecord | null {
  if (!r) return null
  if (r.type && r.type.toLowerCase() !== 'txt') return null
  const name = r.txt_name || r.name
  const value = r.txt_value || r.value
  if (!name || !value) return null
  return { type: 'TXT', name: name.replace(/\.$/, ''), value, purpose }
}

export function getRequiredDnsRecords(
  domain: string,
  cfMeta: unknown
): RequiredDnsRecord[] {
  const records: RequiredDnsRecord[] = [
    {
      type: 'CNAME',
      name: domain,
      value: getCnameTarget(),
      purpose: 'routing',
    },
  ]

  const meta = (cfMeta ?? {}) as {
    ownership_verification?: TxtLike
    ssl?: { validation_records?: TxtLike[] }
    validation_records?: TxtLike[]
  }

  const candidates = [
    toTxt(meta.ownership_verification, 'ownership'),
    ...(meta.ssl?.validation_records ?? []).map((r) => toTxt(r, 'certificate')),
    // Older rows stored a flattened list
    ...(meta.validation_records ?? []).map((r) => toTxt(r, 'certificate')),
  ]

  const seen = new Set<string>()
  for (const r of candidates) {
    if (!r) continue
    const key = `${r.name}|${r.value}`
    if (seen.has(key)) continue
    seen.add(key)
    records.push(r)
  }

  return records
}
