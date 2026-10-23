import { NextResponse } from 'next/server'

import { join } from 'path'

import { requireAdmin } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { emitAuditEvent } from '@/lib/events/audit-helper'
import { loggers } from '@/lib/logger'
import { getStorageProvider } from '@/lib/storage'

const logger = loggers.users

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response: authResponse } = await requireAdmin()
    if (authResponse) return authResponse

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        files: {
          select: {
            path: true,
          },
        },
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const storageProvider = await getStorageProvider()

    for (const file of user.files) {
      try {
        await storageProvider.deleteFile(file.path)
      } catch (error) {
        logger.error(`Error deleting file ${file.path}:`, error as Error)
      }
    }

    if (user.image?.startsWith('/api/avatars/')) {
      try {
        const avatarPath = join(
          'uploads',
          'avatars',
          user.image.split('/').pop() || ''
        )
        await storageProvider.deleteFile(avatarPath)
      } catch (error) {
        logger.error('Error deleting avatar:', error as Error)
      }
    }

    await prisma.user.delete({
      where: { id },
    })

    await emitAuditEvent('account.deleted', {
      userId: user.id,
      email: user.email ?? '',
      deletedBy: 'admin',
      reason: 'Admin-initiated deletion',
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error('Error deleting user:', error as Error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
