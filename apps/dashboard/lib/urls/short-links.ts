import { prisma } from '@emberly/db'

import { appUrl } from '@/lib/config/env'
import { defaultUploadDomain } from '@/lib/domain/default'
import { urlForHost } from '@/lib/utils'

/**
 * The user's verified custom domains, which short links can use, and the one
 * new links use by default (see defaultUploadDomain), when it's verified.
 */
export async function shortLinkDomains(
  userId: string,
  preferredUploadDomain?: string | null
) {
  const [rows, preferred] = await Promise.all([
    prisma.customDomain.findMany({
      where: { userId, verified: true },
      orderBy: [{ isPrimary: 'desc' }, { domain: 'asc' }],
      select: { domain: true },
    }),
    defaultUploadDomain(userId, preferredUploadDomain),
  ])
  const domains = rows.map((d) => d.domain)
  const defaultDomain =
    preferred && domains.includes(preferred) ? preferred : null
  return { domains, defaultDomain }
}

export function shortLinkUrl(shortCode: string, domain?: string | null) {
  const base = (domain ? urlForHost(domain) : appUrl()).replace(/\/+$/, '')
  return `${base}/u/${shortCode}`
}
