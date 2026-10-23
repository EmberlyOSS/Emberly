import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'

const logger = loggers.users

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

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
