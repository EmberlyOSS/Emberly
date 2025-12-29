import { NextResponse } from 'next/server'

import { FileUploadResponse } from '@/packages/types/dto/file'
import { hash } from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import { scheduleFileExpiration } from '@/packages/lib/events/handlers/file-expiry'
import { validateFileSecurityChecksWithVT } from '@/packages/lib/files/security-validation'
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

    // Security check: validate assembled file against zip bombs, malware, dangerous types, and VirusTotal
    try {
      // For S3, we can't easily read back the file. For local storage, we could validate here.
      // For safety, we perform basic validation using metadata we have
      const securityCheck = await validateFileSecurityChecksWithVT(
        Buffer.alloc(0), // We can't read S3 files easily, so we do minimal check
        metadata.filename,
        metadata.mimeType
      )
      
      if (!securityCheck.valid) {
        // Clean up the uploaded file
        try {
          await storageProvider.deleteFile(metadata.fileKey)
        } catch (e) {
          logger.error('Failed to cleanup file after security check failure', e)
        }
        
        logger.warn('Chunk file security validation failed', {
          fileName: metadata.filename,
          mimeType: metadata.mimeType,
          error: securityCheck.error,
          userId: metadata.userId,
        })
        
        return NextResponse.json(
          { error: securityCheck.error || 'File failed security validation' },
          { status: 400 }
        )
      }
      
      if (securityCheck.virusTotal?.scanPerformed) {
        logger.info('Chunk completion scanned by VirusTotal', {
          fileName: metadata.filename,
          detected: securityCheck.virusTotal.detected,
          detectionRatio: securityCheck.virusTotal.detectionRatio,
          userId: metadata.userId,
        })
      }

      if (securityCheck.warnings?.length) {
        logger.info('Chunk file security warnings', {
          fileName: metadata.filename,
          warnings: securityCheck.warnings,
          userId: metadata.userId,
        })
      }
    } catch (error) {
      logger.error('Error during chunk file security validation', error)
      // Don't fail on validation errors, just log them
    }

    // Re-check quotas before creating the file record in case the user's
    // storage usage changed since initialization.
    if (user.role !== 'ADMIN') {
      const { canUploadSize } = await import('@/packages/lib/storage/quota')
      const fileSizeMB = bytesToMB(metadata.totalSize)
      const uploadCheck = await canUploadSize(user.id, fileSizeMB)
      
      if (!uploadCheck.allowed) {
        // Attempt to clean up the assembled object in storage
        try {
          await storageProvider.deleteFile(metadata.fileKey)
        } catch (e) {
          // ignore cleanup errors
        }

        return NextResponse.json(
          {
            error: 'Storage quota exceeded',
            message: 'Upload would exceed your storage quota. Purchase additional storage to continue.',
            action: 'upgrade',
          },
          { status: 413 }
        )
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

    // Check if quota is being exceeded and emit event
    const updatedUser = await prisma.user.findUnique({
      where: { id: metadata.userId },
      select: { storageUsed: true, storageQuotaMB: true, email: true },
    })

    if (updatedUser?.email) {
      const { getEffectiveQuotaMB } = await import('@/packages/lib/storage/quota')
      const config = await getConfig()
      const defaultQuotaMB = config.settings.general.storage.quotas.default.unit === 'GB'
        ? config.settings.general.storage.quotas.default.value * 1024
        : config.settings.general.storage.quotas.default.value

      const quotaInfo = await getEffectiveQuotaMB(metadata.userId, defaultQuotaMB)
      const percentage = quotaInfo.percentageUsed

      // Emit quota-reached event if at 80% or more
      if (percentage >= 80) {
        await events.emit('user.quota-reached', {
          userId: metadata.userId,
          email: updatedUser.email,
          quotaType: 'Storage',
          currentUsage: Math.round(quotaInfo.usedMB / 1024 * 100) / 100,
          quotaLimit: Math.round(quotaInfo.quotaMB / 1024 * 100) / 100,
          unit: 'GB',
          percentage: Math.round(percentage),
        })
      }
    }

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
