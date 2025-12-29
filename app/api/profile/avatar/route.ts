import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { join } from 'path'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { S3StorageProvider, getStorageProvider } from '@/packages/lib/storage'
import { bytesToMB } from '@/packages/lib/utils'

const logger = loggers.users

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    const config = await getConfig()
    const quotasEnabled = config.settings.general.storage.quotas.enabled
    const defaultQuota = config.settings.general.storage.quotas.default

    if ((session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
      const { canUploadSize } = await import('@/packages/lib/storage/quota')
      const fileSizeMB = bytesToMB(file.size)
      const uploadCheck = await canUploadSize(session.user.id, fileSizeMB)

      if (!uploadCheck.allowed) {
        return NextResponse.json(
          {
            error: 'Storage quota exceeded',
            message: uploadCheck.reason || 'You have reached your storage quota. Purchase additional storage to continue.',
          },
          { status: 413 }
        )
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    })

    const bytes = await file.arrayBuffer()
    const processedImage = Buffer.from(bytes)

    const storageProvider = await getStorageProvider()
    const avatarFilename = `${session.user.id}.jpg`
    const avatarPath = join('uploads', 'avatars', avatarFilename)
    // capture host headers (if present) and store as metadata on the object
    const incomingHeaders = req.headers
    const meta: Record<string, string> = {}
    const cordx = incomingHeaders.get('x-cordx-host')
    const emberly = incomingHeaders.get('x-emberly-host')
    if (cordx) meta['x-cordx-host'] = cordx
    if (emberly) meta['x-emberly-host'] = emberly
    let publicPath = `/api/avatars/${avatarFilename}`

    if (user?.image?.startsWith('/api/avatars/')) {
      try {
        const oldFilename = user.image.split('/').pop()
        if (oldFilename) {
          const oldPath = join('uploads', 'avatars', oldFilename)
          await storageProvider.deleteFile(oldPath)
        }
      } catch (error) {
        logger.error('Failed to delete old avatar', error as Error, {
          userId: session.user.id,
          oldPath: user.image,
        })
      }
    }

    await storageProvider.uploadFile(
      processedImage,
      avatarPath,
      'image/jpeg',
      meta
    )

    if (storageProvider instanceof S3StorageProvider) {
      publicPath = await storageProvider.getFileUrl(avatarPath)
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: publicPath,
      },
      select: { id: true, image: true },
    })

    logger.info('Avatar uploaded', {
      userId: session.user.id,
      avatar: publicPath,
      dbImage: updated.image,
    })

    // Return both `url` and `image` for compatibility with different callers
    return NextResponse.json({
      success: true,
      url: publicPath,
      image: publicPath,
    })
  } catch (error) {
    logger.error('Avatar upload error', error as Error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}
