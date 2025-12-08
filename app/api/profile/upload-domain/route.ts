import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/database/prisma'
import { loggers } from '@/lib/logger'

const logger = loggers.users

const DEFAULT_HOSTS = ['emberly.site', 'embrly.ca']

export async function GET(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const customDomains = await prisma.customDomain.findMany({
      where: { userId: user.id, verified: true },
      select: { domain: true },
    })

    const domains = [...DEFAULT_HOSTS, ...customDomains.map((d) => d.domain)]

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferredUploadDomain: true },
    })

    return NextResponse.json({
      domains,
      selected: userData?.preferredUploadDomain || null,
    })
  } catch (error) {
    logger.error('Error fetching upload domains', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const body = await req.json()
    const domain = (body?.domain || '').trim()
    if (!domain)
      return NextResponse.json({ error: 'Missing domain' }, { status: 400 })

    // Validate domain is either default host or a verified custom domain owned by the user
    const allowedDefault = DEFAULT_HOSTS.includes(domain)
    if (!allowedDefault) {
      const found = await prisma.customDomain.findFirst({
        where: { domain, userId: user.id, verified: true },
      })
      if (!found)
        return NextResponse.json(
          { error: 'Domain not allowed' },
          { status: 400 }
        )
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { preferredUploadDomain: domain },
      select: { preferredUploadDomain: true },
    })

    return NextResponse.json({ selected: updated.preferredUploadDomain })
  } catch (error) {
    logger.error('Error setting preferred upload domain', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
