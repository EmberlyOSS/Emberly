import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'

import { hash } from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/packages/lib/database/prisma'
import { emitAuditEvent } from '@/packages/lib/events/audit-helper'
import { loggers } from '@/packages/lib/logger'
import { getStorageProvider } from '@/packages/lib/storage'

const logger = loggers.files

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const schema = z.object({
      visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
      password: z.string().nullable().optional(),
    })
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { user, response } = await requireAuth(request)
    if (response) return response

    const file = await prisma.file.findUnique({
      where: { id },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (file.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      visibility,
      password,
    }: {
      visibility?: 'PUBLIC' | 'PRIVATE'
      password?: string | null
    } = result.data

    const updates: {
      visibility?: 'PUBLIC' | 'PRIVATE'
      password?: string | null
    } = {}

    if (visibility) {
      updates.visibility = visibility
    }

    if (typeof password !== 'undefined') {
      updates.password = password ? await hash(password, 10) : null
    }

    const updatedFile = await prisma.file.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json(updatedFile)
  } catch (error) {
    logger.error('File update error', error as Error)
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const { id: fileId } = await params
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (file.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const storageProvider = await getStorageProvider()
      await storageProvider.deleteFile(file.path)
    } catch (error) {
      logger.error('Error deleting file from storage', error as Error, {
        fileId,
        filePath: file.path,
      })
    }

    await prisma.$transaction(async (tx) => {
      await tx.file.delete({
        where: { id: fileId },
      })

      await tx.user.update({
        where: { id: user.id },
        data: {
          storageUsed: {
            decrement: file.size,
          },
        },
      })
    })

    void emitAuditEvent('file.deleted', {
      fileId,
      userId: file.userId,
      fileName: file.name,
      fileSize: file.size,
      deletedBy: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('File delete error', error as Error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
