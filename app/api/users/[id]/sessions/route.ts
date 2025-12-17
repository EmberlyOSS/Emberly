import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.users

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params

    await prisma.user.update({
      where: { id },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error('Error invalidating sessions:', error as Error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
