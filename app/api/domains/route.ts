import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { loggers } from '@/lib/logger'

const logger = loggers.domains || loggers.app
import { createCustomHostname } from '@/lib/cloudflare/client'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    let domains = await prisma.customDomain.findMany({
      where: { userId: session.user.id },
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
            logger.debug('Cloudflare create on GET failed', cfErr as Error)
          }
        } catch (err) {
          logger.debug('Failed to mark domain unverified', err as Error)
        }
      }
    }

    // refetch to include potential updates
    domains = await prisma.customDomain.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ domains })
  } catch (error) {
    logger.error('Error fetching domains', error as Error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const body = await req.json()
    const domain = (body.domain || '').toString().trim().toLowerCase()

    if (!domain || !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)) {
      return new NextResponse('Invalid domain', { status: 400 })
    }

    // Ensure not already claimed
    const existing = await prisma.customDomain.findUnique({ where: { domain } })
    if (existing)
      return new NextResponse('Domain already exists', { status: 409 })

    const created = await prisma.customDomain.create({
      data: {
        domain,
        userId: session.user.id,
        // mark awaiting CNAME by default; frontend should prompt user to add CNAME
        cfStatus: 'awaiting_cname',
      },
    })

    const updated = await prisma.customDomain.findUnique({ where: { id: created.id } })
    return NextResponse.json({ domain: updated })
  } catch (error) {
    logger.error('Error creating custom domain', error as Error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
