import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import {
  canAddCustomDomain,
  getPlanLimits,
  getUserDomainCount,
} from '@/packages/lib/storage/quota'
import { calculateDomainSlotBonus } from '@/packages/lib/perks'

const logger = loggers.domains
import { createCustomHostname } from '@/packages/lib/cloudflare/client'
import { isValidDomainName } from '@/packages/lib/domain/service'
import { getRequiredDnsRecords } from '@/packages/lib/domain/dns-records'

function determineAllowedFromSubs(subs: Array<any>) {
  const baseLimits: Record<string, number> = { free: 3, starter: 5, pro: 10 }
  let allowed = baseLimits.free
  const proProductId = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_PRO
  const starterProductId = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_STARTER
  for (const s of subs) {
    const stripeId = String(s.product?.stripeProductId || '').trim()
    const slug = String(s.product?.slug || '').toLowerCase()
    if (stripeId && proProductId && stripeId === proProductId)
      allowed = Math.max(allowed, baseLimits.pro)
    if (stripeId && starterProductId && stripeId === starterProductId)
      allowed = Math.max(allowed, baseLimits.starter)
    if (slug && baseLimits[slug] && baseLimits[slug] > allowed)
      allowed = baseLimits[slug]
  }
  return allowed
}

export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  try {
    let domains = await prisma.customDomain.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    // For domains created prior to Cloudflare integration, proactively
    // mark them unverified and trigger creation of a Cloudflare hostname
    // (non-blocking) so the UI can surface CF verification instructions.
    for (const d of domains) {
      if (d.verified && !d.cfHostnameId) {
        try {
          await prisma.customDomain.update({
            where: { id: d.id },
            data: { verified: false },
          })
          // attempt to create CF hostname; don't block on failure
          try {
            const cfRes = await createCustomHostname(d.domain)
            if (cfRes?.id) {
              await prisma.customDomain.update({
                where: { id: d.id },
                data: {
                  cfHostnameId: cfRes.id,
                  cfStatus: String(cfRes.status || cfRes.state || ''),
                  cfMeta: cfRes,
                },
              })
            }
          } catch (cfErr) {
            logger.debug('Cloudflare create on GET failed', {
              error: cfErr instanceof Error ? cfErr.message : String(cfErr),
            })
          }
        } catch (err) {
          logger.debug('Failed to mark domain unverified', {
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }

    // refetch to include potential updates
    domains = await prisma.customDomain.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    const domainsWithRecords = domains.map((d) => ({
      ...d,
      requiredRecords: getRequiredDnsRecords(d.domain, d.cfMeta),
    }))

    // Calculate domain limits including plan, purchases, and perk bonuses
    try {
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { perkRoles: true },
      })

      const limits = await getPlanLimits(user.id)
      const purchases = await prisma.oneOffPurchase.findMany({
        where: { userId: user.id, type: 'custom_domain' },
      })
      const purchased = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0)
      const perkBonus = calculateDomainSlotBonus(userRecord?.perkRoles || [])

      const base = limits.customDomainsLimit
      const unlimited = base === null
      const totalAllowed = unlimited ? null : base + purchased + perkBonus
      const used = domains.length
      const remaining =
        totalAllowed === null ? null : Math.max(0, totalAllowed - used)

      return NextResponse.json({
        domains: domainsWithRecords,
        domainLimit: {
          allowed: totalAllowed,
          base,
          purchased,
          perkBonus,
          used,
          remaining,
          unlimited,
        },
      })
    } catch (err) {
      logger.error(
        'Error computing domain limits',
        err instanceof Error ? err : String(err)
      )
      return NextResponse.json({ domains: domainsWithRecords })
    }
  } catch (error) {
    logger.error(
      'Error fetching domains',
      error instanceof Error ? error : String(error)
    )
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  try {
    const body = await req.json()
    const domain = (body.domain || '').toString().trim().toLowerCase()

    if (!domain || !isValidDomainName(domain)) {
      return new NextResponse('Invalid domain', { status: 400 })
    }

    // Ensure not already claimed
    const existing = await prisma.customDomain.findUnique({ where: { domain } })
    if (existing)
      return new NextResponse('Domain already exists', { status: 409 })

    // Check if user can add more domains (includes plan limits, purchases, and perk bonuses)
    const canAdd = await canAddCustomDomain(user.id)
    if (!canAdd) {
      return new NextResponse('Domain limit reached', { status: 403 })
    }

    const created = await prisma.customDomain.create({
      data: {
        domain,
        userId: user.id,
        // mark awaiting CNAME by default; frontend should prompt user to add CNAME
        cfStatus: 'awaiting_cname',
      },
    })

    const updated = await prisma.customDomain.findUnique({
      where: { id: created.id },
    })
    return NextResponse.json({ domain: updated })
  } catch (error) {
    logger.error(
      'Error creating custom domain',
      error instanceof Error ? error : String(error)
    )
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
