import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { loggers } from '@/lib/logger'

const logger = loggers.domains || loggers.app

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

    return new NextResponse('Bad Request', { status: 400 })
  } catch (error) {
    logger.error('Error updating domain', error as Error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
