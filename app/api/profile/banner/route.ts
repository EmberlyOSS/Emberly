import { NextResponse } from 'next/server'
import { join } from 'path'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { handleApiError } from '@/packages/lib/api/error-handler'
import { S3StorageProvider, getStorageProvider } from '@/packages/lib/storage'

const logger = loggers.users

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'File must be a JPEG, PNG, WebP, or GIF image' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size must not exceed 5 MB' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { banner: true },
    })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const storageProvider = await getStorageProvider()
    const ext = MIME_TO_EXT[file.type] ?? 'jpg'
    const bannerFilename = `${user.id}.${ext}`
    const bannerPath = join('uploads', 'banners', bannerFilename)

    const incomingHeaders = req.headers
    const meta: Record<string, string> = {}
    const cordx = incomingHeaders.get('x-cordx-host')
    const emberly = incomingHeaders.get('x-emberly-host')
    if (cordx) meta['x-cordx-host'] = cordx
    if (emberly) meta['x-emberly-host'] = emberly

    // Delete the old banner from storage if it was a locally-stored path
    if (existing?.banner?.startsWith('/api/') || existing?.banner?.startsWith('uploads/')) {
      try {
        const oldBanner = existing.banner
        // Derive the storage key from a local API path like /api/... or a raw storage path
        const oldStoragePath = oldBanner.startsWith('uploads/')
          ? oldBanner
          : null
        if (oldStoragePath) {
          await storageProvider.deleteFile(oldStoragePath)
        }
      } catch (error) {
        logger.error('Failed to delete old banner', error as Error, {
          userId: user.id,
          oldBanner: existing.banner,
        })
      }
    }

    await storageProvider.uploadFile(buffer, bannerPath, file.type, meta)

    let publicPath = `/api/profile/banner/${bannerFilename}`
    if (storageProvider instanceof S3StorageProvider) {
      publicPath = await storageProvider.getFileUrl(bannerPath)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { banner: publicPath },
    })

    logger.info('Banner uploaded', { userId: user.id, banner: publicPath })

    return NextResponse.json({ success: true, url: publicPath })
  } catch (error) {
    return handleApiError(error, 'Failed to upload banner', {
      loggerName: 'users',
    })
  }
}

export async function DELETE(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { banner: true },
    })

    if (existing?.banner) {
      const storageProvider = await getStorageProvider()

      // Attempt to delete from storage for locally-stored paths
      const oldBanner = existing.banner
      const oldStoragePath = oldBanner.startsWith('uploads/') ? oldBanner : null
      if (oldStoragePath) {
        try {
          await storageProvider.deleteFile(oldStoragePath)
        } catch (error) {
          logger.error('Failed to delete banner file from storage', error as Error, {
            userId: user.id,
            path: oldStoragePath,
          })
        }
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { banner: null },
    })

    logger.info('Banner deleted', { userId: user.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Failed to delete banner', {
      loggerName: 'users',
    })
  }
}
