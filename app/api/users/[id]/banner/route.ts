import { NextResponse } from 'next/server'
import { join } from 'path'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { getStorageProvider } from '@/packages/lib/storage'
import {
  mediaPublicUrl,
  storagePathFromMediaUrl,
} from '@/packages/lib/storage/public-media'

const logger = loggers.users

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const { id } = await params

    if (user.id !== id && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { banner: true },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const bytes = await file.arrayBuffer()
    const processedImage = Buffer.from(bytes)

    const storageProvider = await getStorageProvider()
    const bannerFilename = `${id}.jpg`
    const bannerPath = join('uploads', 'banners', bannerFilename)
    const publicPath = mediaPublicUrl('banners', bannerFilename)

    const oldBannerPath = storagePathFromMediaUrl(
      existingUser.banner,
      'banners'
    )
    if (oldBannerPath) {
      try {
        await storageProvider.deleteFile(oldBannerPath)
      } catch (error) {
        logger.error('Failed to delete old banner', error as Error, {
          userId: id,
          oldPath: existingUser.banner,
        })
      }
    }

    await storageProvider.uploadFile(processedImage, bannerPath, 'image/jpeg')

    await prisma.user.update({
      where: { id },
      data: { banner: publicPath },
    })

    logger.info('Banner uploaded', {
      userId: id,
      bannerUrl: publicPath,
    })

    return NextResponse.json({ bannerUrl: publicPath })
  } catch (error) {
    logger.error('Banner upload error', error as Error)
    return NextResponse.json(
      { error: 'Failed to upload banner' },
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

    const { id } = await params

    if (user.id !== id && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { banner: true },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const bannerPath = storagePathFromMediaUrl(existingUser.banner, 'banners')
    if (bannerPath) {
      try {
        const storageProvider = await getStorageProvider()
        await storageProvider.deleteFile(bannerPath)
      } catch (error) {
        logger.error('Error deleting banner file', error as Error, {
          userId: id,
          bannerPath: existingUser.banner,
        })
      }
    }

    await prisma.user.update({
      where: { id },
      data: { banner: null },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error('Error removing banner', error as Error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
