import { NextResponse } from 'next/server'

import { FileUploadResponse } from '@/packages/types/dto/file'
import { hash } from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { scheduleFileExpiration } from '@/packages/lib/events/handlers/file-expiry'
import { loggers } from '@/packages/lib/logger'
import { processImageOCR } from '@/packages/lib/ocr'
import { getStorageProvider } from '@/packages/lib/storage'
import { bytesToMB } from '@/packages/lib/utils'
import { getConfig } from '@/packages/lib/config'

const logger = loggers.files

interface RouteParams {
  uploadId: string
}

async function getAuthenticatedUser(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, storageUsed: true, storageQuotaMB: true, urlId: true, role: true },
    })
    return user
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const user = await prisma.user.findUnique({
      where: { uploadToken: token },
      select: { id: true, storageUsed: true, storageQuotaMB: true, urlId: true, role: true },
    })
    return user
  }

  return null
}

async function getUploadMetadata(localId: string) {
  try {
    const TEMP_DIR = join(process.cwd(), 'tmp', 'uploads')
    const metadataPath = join(TEMP_DIR, `meta-${localId}`)
    const data = await readFile(metadataPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    if (error instanceof Error) {
      logger.debug(`Error reading metadata for upload ${localId}`, {
        error: error.message,
      })
    }
    return null
  }
}

async function deleteUploadMetadata(localId: string) {
  try {
    const TEMP_DIR = join(process.cwd(), 'tmp', 'uploads')
    const metadataPath = join(TEMP_DIR, `meta-${localId}`)
    await unlink(metadataPath)
  } catch (err) {
    logger.debug(`Error deleting metadata for upload ${localId}`, {
      error: err,
    })
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<RouteParams> }
) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uploadId: localId } = await context.params

    const metadata = await getUploadMetadata(localId)
    if (!metadata) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    if (metadata.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { parts, expiresAt } = body

    if (!Array.isArray(parts)) {
      return NextResponse.json({ error: 'Invalid parts data' }, { status: 400 })
    }

    const storageProvider = await getStorageProvider()
    await storageProvider.completeMultipartUpload(
      metadata.fileKey,
      metadata.s3UploadId,
      parts
    )

    // Re-check quotas before creating the file record in case the user's
    // storage usage changed since initialization.
    const config = await getConfig()
    const quotasEnabled = config.settings.general.storage.quotas.enabled
    const defaultQuota = config.settings.general.storage.quotas.default

    if (quotasEnabled && user.role !== 'ADMIN') {
      const quotaMB = user.storageQuotaMB ?? defaultQuota.value * (defaultQuota.unit === 'GB' ? 1024 : 1)
      const fileSizeMB = bytesToMB(metadata.totalSize)
      if (user.storageUsed + fileSizeMB > quotaMB) {
        // Attempt to clean up the assembled object in storage
        try {
          await storageProvider.deleteFile(metadata.fileKey)
        } catch (e) {
          // ignore cleanup errors
        }

        return NextResponse.json({ error: 'Upload would exceed your storage quota' }, { status: 413 })
      }
    }

    const fileRecord = await prisma.$transaction(async (tx) => {
      const file = await tx.file.create({
        data: {
          name: metadata.filename,
          urlPath: metadata.urlPath,
          mimeType: metadata.mimeType,
          size: bytesToMB(metadata.totalSize),
          path: metadata.fileKey,
          visibility: metadata.visibility,
          password: metadata.password
            ? await hash(metadata.password, 10)
            : null,
          user: {
            connect: {
              id: metadata.userId,
            },
          },
        },
      })

      await tx.user.update({
        where: { id: metadata.userId },
        data: {
          storageUsed: {
            increment: bytesToMB(metadata.totalSize),
          },
        },
      })

      return file
    })

    await deleteUploadMetadata(localId)

    if (metadata.mimeType.startsWith('image/')) {
      processImageOCR(metadata.fileKey, fileRecord.id).catch((error: Error) => {
        logger.error('Background OCR processing failed', error, {
          fileId: fileRecord.id,
          fileKey: metadata.fileKey,
        })
      })
    }

    if (expiresAt) {
      try {
        const expirationDate = new Date(expiresAt)
        if (!isNaN(expirationDate.getTime()) && expirationDate > new Date()) {
          await scheduleFileExpiration(
            fileRecord.id,
            user.id,
            metadata.filename,
            expirationDate
          )
          logger.info('File expiration scheduled', {
            fileId: fileRecord.id,
            fileName: metadata.filename,
            expirationDate,
          })
        }
      } catch (error) {
        logger.error('Failed to schedule file expiration', error as Error, {
          fileId: fileRecord.id,
        })
      }
    }

    let finalFullUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : process.env.NEXTAUTH_URL?.replace(/\/$/, '') || ''
    finalFullUrl = finalFullUrl.startsWith('http')
      ? finalFullUrl
      : `https://${finalFullUrl}`

    if (metadata.domain) {
      try {
        const domainRecord = await prisma.customDomain.findFirst({
          where: { domain: metadata.domain, userId: user.id, verified: true },
        })
        if (domainRecord) {
          const host = domainRecord.domain.replace(/\/$/, '')
          finalFullUrl = host.startsWith('http') ? host : `https://${host}`
        }
      } catch (err) {
        // ignore and fall back to server URL
      }
    }

    const responseData: FileUploadResponse = {
      url: `${finalFullUrl}${metadata.urlPath}`,
      name: metadata.filename,
      size: metadata.totalSize,
      type: metadata.mimeType,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    logger.error('Error completing upload', error as Error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to complete upload',
      },
      { status: 500 }
    )
  }
}
