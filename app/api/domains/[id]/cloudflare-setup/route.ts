import { NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { rateLimiter } from '@/packages/lib/cache/rate-limit'
import {
  UserCloudflareError,
  createRecord,
  deleteRecord,
  findConflicts,
  findZoneForHostname,
  type ExistingDnsRecord,
} from '@/packages/lib/cloudflare/user-dns'
import { getRequiredDnsRecords } from '@/packages/lib/domain/dns-records'
import { getDomainWithOwnership } from '@/packages/lib/domain/service'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.domains

const BodySchema = z.object({
  // The user's Cloudflare API token. Used for this request only and never
  // stored or logged — don't add it to any log line or response below.
  apiToken: z.string().trim().min(20).max(200),
  /** Replace conflicting records the user has already been shown */
  replaceConflicts: z.boolean().optional().default(false),
})

/**
 * POST /api/domains/:id/cloudflare-setup
 * Creates the required DNS records in the user's own Cloudflare zone.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { allowed } = await rateLimiter.check(
    `domains:cf-setup:${user.id}`,
    10,
    600
  )
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again in 10 minutes.' },
      { status: 429 }
    )
  }

  const { id } = await params
  const domain = await getDomainWithOwnership(id, user.id)
  if (!domain) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = BodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Enter a valid Cloudflare API token' },
      { status: 400 }
    )
  }
  const { apiToken, replaceConflicts } = parsed.data

  const records = getRequiredDnsRecords(domain.domain, domain.cfMeta)

  try {
    const zone = await findZoneForHostname(apiToken, domain.domain)

    // Check everything before changing anything, so a conflict never leaves
    // the zone half-configured
    const plan: Array<{
      record: (typeof records)[number]
      matches: boolean
      conflicts: ExistingDnsRecord[]
    }> = []
    for (const record of records) {
      plan.push({ record, ...(await findConflicts(apiToken, zone.id, record)) })
    }

    const conflicts = plan.flatMap((p) =>
      p.conflicts.map((c) => ({
        type: c.type,
        name: c.name,
        content: c.content,
      }))
    )
    if (conflicts.length > 0 && !replaceConflicts) {
      return NextResponse.json(
        {
          error: 'Existing DNS records would be replaced',
          conflicts,
        },
        { status: 409 }
      )
    }

    const created: string[] = []
    for (const p of plan) {
      if (p.matches) continue
      for (const c of p.conflicts) await deleteRecord(apiToken, zone.id, c.id)
      await createRecord(apiToken, zone.id, p.record)
      created.push(`${p.record.type} ${p.record.name}`)
    }

    logger.info('Custom domain DNS configured via user Cloudflare token', {
      userId: user.id,
      domainId: id,
      zone: zone.name,
      created,
      replaced: conflicts.length,
    })

    return NextResponse.json({
      zone: zone.name,
      created,
      alreadyPresent: plan.filter((p) => p.matches).length,
    })
  } catch (err) {
    if (err instanceof UserCloudflareError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    logger.error('Cloudflare DNS setup failed', {
      userId: user.id,
      domainId: id,
      message: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: 'Something went wrong while configuring DNS' },
      { status: 500 }
    )
  }
}
