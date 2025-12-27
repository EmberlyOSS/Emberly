import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.domains

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const { id } = await params
    const domain = await prisma.customDomain.findUnique({ where: { id } })
    if (!domain || domain.userId !== session.user.id)
      return new NextResponse('Not found', { status: 404 })

    await prisma.customDomain.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error('Error deleting domain', error as Error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const action = body.action as string | undefined

    const domain = await prisma.customDomain.findUnique({ where: { id } })
    if (!domain || domain.userId !== session.user.id)
      return new NextResponse('Not found', { status: 404 })

    if (action === 'setPrimary') {
      if (!domain.verified)
        return new NextResponse('Domain not verified', { status: 400 })

      await prisma.$transaction([
        prisma.customDomain.updateMany({
          where: { userId: session.user.id },
          data: { isPrimary: false },
        }),
        prisma.customDomain.update({
          where: { id },
          data: { isPrimary: true },
        }),
      ])

      return new NextResponse(null, { status: 204 })
    }

    if (action === 'update') {
      const newDomain = (body.domain || '').toString().trim().toLowerCase()
      if (!newDomain || !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(newDomain)) {
        return new NextResponse('Invalid domain', { status: 400 })
      }

      // Ensure not already claimed by someone else
      const existing = await prisma.customDomain.findUnique({ where: { domain: newDomain } })
      if (existing && existing.id !== id) return new NextResponse('Domain already exists', { status: 409 })

      // Update domain name and mark unverified so operator can reprovision
      await prisma.customDomain.update({ where: { id }, data: { domain: newDomain, verified: false, cfHostnameId: null, cfMeta: null, cfStatus: null } })
      return new NextResponse(null, { status: 204 })
    }

    return new NextResponse('Bad Request', { status: 400 })
  } catch (error) {
    logger.error('Error updating domain', error as Error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
