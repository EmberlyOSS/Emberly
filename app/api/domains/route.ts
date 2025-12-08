import { NextResponse } from 'next/server'

import crypto from 'crypto'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { loggers } from '@/lib/logger'

const logger = loggers.domains || loggers.app

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const domains = await prisma.customDomain.findMany({
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

    const verificationToken = crypto.randomUUID()

    const created = await prisma.customDomain.create({
      data: {
        domain,
        userId: session.user.id,
        verificationToken,
      },
    })

    return NextResponse.json({ domain: created })
  } catch (error) {
    logger.error('Error creating custom domain', error as Error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
