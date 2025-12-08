import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { join } from 'path'

import { authOptions } from '@/lib/auth'
import { getConfig } from '@/lib/config'
import { loggers } from '@/lib/logger'
import { S3StorageProvider, getStorageProvider } from '@/lib/storage'

const logger = loggers.files

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return new NextResponse('No file provided', { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // browsers can handle resizing (i think)
    const processedBuffer = buffer

    const storageProvider = await getStorageProvider()
    const faviconPath = join('uploads', 'favicon.png')
    let publicPath = '/api/favicon'

    const config = await getConfig()
    if (config.settings.appearance.favicon) {
      try {
        const oldPath = join('uploads', 'favicon.png')
        await storageProvider.deleteFile(oldPath)
      } catch (error) {
        logger.error('Failed to delete old favicon:', error as Error)
      }
    }

    // preserve host headers if provided
    const meta: Record<string, string> = {}
    try {
      const headers = (req as any).headers as Headers | undefined
      if (headers) {
        const cordx = headers.get?.('x-cordx-host')
        const emberly = headers.get?.('x-emberly-host')
        if (cordx) meta['x-cordx-host'] = cordx
        if (emberly) meta['x-emberly-host'] = emberly
      }
    } catch (e) {
      // ignore
    }

    await storageProvider.uploadFile(
      processedBuffer,
      faviconPath,
      'image/png',
      meta
    )

    if (storageProvider instanceof S3StorageProvider) {
      publicPath = await storageProvider.getFileUrl(faviconPath)
    }

    config.settings.appearance.favicon = publicPath

    // Persist updated config under the new Emberly key and write config file
    await prisma.config.upsert({
      where: { key: 'emberly_config' },
      create: { key: 'emberly_config', value: config },
      update: { value: config },
    })

    await storageProvider.uploadFile(
      Buffer.from(JSON.stringify(config, null, 2)),
      join(process.cwd(), 'emberly.config.json'),
      'application/json'
    )

    return new NextResponse('Favicon updated successfully', { status: 200 })
  } catch (error) {
    logger.error('Error updating favicon:', error as Error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
