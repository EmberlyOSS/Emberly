import { NextResponse } from 'next/server'

import { hash } from 'bcryptjs'
import { existsSync } from 'fs'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { uploadCache, type UploadMetadata } from '@/packages/lib/cache/upload-cache'
import { isRedisConnected } from '@/packages/lib/cache/redis'
import { getConfig } from '@/packages/lib/config'
import { prisma } from '@/packages/lib/database/prisma'
import { getUniqueFilename } from '@/packages/lib/files/filename'
import { validateUploadRequest } from '@/packages/lib/files/upload-validation'
import { validateFileSecurityChecksWithVT } from '@/packages/lib/files/security-validation'
import { loggers } from '@/packages/lib/logger'
import { processImageOCR } from '@/packages/lib/ocr'
import { getStorageProvider } from '@/packages/lib/storage'
import { bytesToMB } from '@/packages/lib/utils'

const logger = loggers.files

// Fallback filesystem storage when Redis is unavailable
const TEMP_DIR = join(process.cwd(), 'tmp', 'uploads')

if (!existsSync(TEMP_DIR)) {
  mkdir(TEMP_DIR, { recursive: true }).catch((error) => {
    logger.error('Failed to create temp directory', error as Error)
  })
}

// Cleanup stale uploads (Redis handles TTL, this is for filesystem fallback)
setInterval(
  async () => {
    try {
      // Clean up Redis stale entries
      if (isRedisConnected()) {
        await uploadCache.cleanup()
      }

      // Clean up filesystem fallback
      const { readdir } = await import('fs/promises')
      const files = await readdir(TEMP_DIR)
      const now = Date.now()

      for (const file of files) {
        try {
          const metadataPath = join(TEMP_DIR, file)
          const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))

          if (now - metadata.lastActivity > 60 * 60 * 1000) {
            await unlink(metadataPath)
          }
        } catch (error) {
          logger.error(`Error cleaning up file ${file}`, error as Error)
        }
      }
    } catch (error) {
      logger.error('Error during cleanup', error as Error)
    }
  },
  60 * 60 * 1000
)

function generateLocalId(): string {
  return Math.random().toString(36).substring(2, 15)
}

async function getUploadMetadata(
  localId: string
): Promise<UploadMetadata | null> {
  // Try Redis first
  if (isRedisConnected()) {
    const cached = await uploadCache.get(localId)
    if (cached) return cached
  }

  // Fallback to filesystem
  try {
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

async function saveUploadMetadata(
  localId: string,
  metadata: UploadMetadata
): Promise<void> {
  // Try Redis first
  if (isRedisConnected()) {
    const saved = await uploadCache.save(localId, metadata)
    if (saved) return
  }

  // Fallback to filesystem
  const metadataPath = join(TEMP_DIR, `meta-${localId}`)
  await writeFile(metadataPath, JSON.stringify(metadata))
}

async function deleteUploadMetadata(localId: string) {
  // Delete from Redis
  if (isRedisConnected()) {
    await uploadCache.delete(localId)
  }

  // Also clean up filesystem fallback
  try {
    const metadataPath = join(TEMP_DIR, `meta-${localId}`)
    await unlink(metadataPath)
  } catch (error) {
    logger.debug(`Error deleting metadata for upload ${localId}`, {
      error,
    })
  }
}

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const body = await req.json()
    const { filename, mimeType, size, domain } = body

    if (!filename || !mimeType || !size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check file size against plan upload cap and storage quota
    if (user.role !== 'ADMIN') {
      const { getPlanLimits, canUploadSize } = await import('@/packages/lib/storage/quota')
      const planLimits = await getPlanLimits(user.id)
      const fileSizeMB = bytesToMB(size)
      
      // Check plan upload size cap
      const maxUploadBytes = planLimits.uploadSizeCapMB * 1024 * 1024
      if (size > maxUploadBytes) {
        return NextResponse.json(
          {
            error: `File exceeds ${planLimits.planName} plan limit`,
            message: `Maximum file size for ${planLimits.planName} is ${planLimits.uploadSizeCapMB}MB. Upgrade your plan to upload larger files.`,
            action: 'upgrade',
          },
          { status: 413 }
        )
      }
      
      // Check storage quota
      const uploadCheck = await canUploadSize(user.id, fileSizeMB)
      if (!uploadCheck.allowed) {
        return NextResponse.json(
          {
            error: 'Storage quota exceeded',
            message: uploadCheck.reason || 'You have reached your storage quota. Purchase additional storage to continue uploading.',
            action: 'upgrade',
          },
          { status: 413 }
        )
      }
    }

    // Validate email verification and custom domain verification
    const uploadValidation = await validateUploadRequest(user.id, domain)
    if (!uploadValidation.valid) {
      return NextResponse.json(
        { error: uploadValidation.error, code: uploadValidation.errorCode },
        { status: 403 }
      )
    }

    // Security check: validate filename and MIME type against dangerous files and VirusTotal
    const securityCheck = await validateFileSecurityChecksWithVT(
      Buffer.alloc(0), // Empty buffer for initial check - full validation on completion
      filename,
      mimeType
    )
    if (!securityCheck.valid) {
      logger.warn('Chunk upload file security validation failed', {
        fileName: filename,
        mimeType,
        error: securityCheck.error,
        userId: user.id,
      })
      return NextResponse.json(
        { error: securityCheck.error || 'File failed security validation' },
        { status: 400 }
      )
    }

    if (securityCheck.virusTotal?.scanPerformed) {
      logger.info('Chunk upload scanned by VirusTotal', {
        fileName: filename,
        detected: securityCheck.virusTotal.detected,
        detectionRatio: securityCheck.virusTotal.detectionRatio,
        userId: user.id,
      })
    }

    if (securityCheck.warnings?.length) {
      logger.info('Chunk upload file security warnings', {
        fileName: filename,
        warnings: securityCheck.warnings,
        userId: user.id,
      })
    }

    const { urlSafeName, displayName } = await getUniqueFilename(
      join('uploads', user.urlId),
      filename,
      user.randomizeFileUrls
    )

    let filePath: string
    let urlPath: string
    try {
      filePath = join('uploads', user.urlId, urlSafeName)
      if (!filePath.startsWith(join('uploads', user.urlId))) {
        throw new Error('Invalid file path: Path traversal detected')
      }
      urlPath = `/${user.urlId}/${urlSafeName}`
    } catch (error) {
      logger.error('Path validation error', error as Error, {
        userId: user.id,
        filename,
      })
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const storageProvider = await getStorageProvider()
    // capture host headers from the incoming request and attach as metadata
    const meta: Record<string, string> = {}
    try {
      const reqHeaders = (req as any).headers as Headers | undefined
      if (reqHeaders) {
        const cordx = reqHeaders.get?.('x-cordx-host')
        const emberly = reqHeaders.get?.('x-emberly-host')
        if (cordx) meta['x-cordx-host'] = cordx
        if (emberly) meta['x-emberly-host'] = emberly
      }
    } catch (e) {
      // ignore
    }

    const s3UploadId = await storageProvider.initializeMultipartUpload(
      filePath,
      mimeType,
      meta
    )

    const localId = generateLocalId()

    const metadata: UploadMetadata = {
      fileKey: filePath,
      filename: displayName,
      mimeType,
      totalSize: size,
      userId: user.id,
      visibility: 'PUBLIC' as const,
      password: null,
      lastActivity: Date.now(),
      urlPath,
      s3UploadId,
      domain: typeof domain === 'string' && domain.length > 0 ? domain : null,
    }

    await saveUploadMetadata(localId, metadata)

    return NextResponse.json({
      data: {
        uploadId: localId,
        fileKey: filePath,
      },
    })
  } catch (error) {
    logger.error('Error initializing upload', error as Error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize upload',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const localId = parts[parts.length - 3]
    const partNumber = parseInt(parts[parts.length - 1])

    const metadata = await getUploadMetadata(localId)
    if (!metadata) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    if (metadata.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storageProvider = await getStorageProvider()
    const presignedUrl = await storageProvider.getPresignedPartUploadUrl(
      metadata.fileKey,
      metadata.s3UploadId,
      partNumber
    )

    metadata.lastActivity = Date.now()
    await saveUploadMetadata(localId, metadata)

    return NextResponse.json({ data: { presignedUrl } })
  } catch (error) {
    logger.error('Error getting presigned URL', error as Error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get presigned URL',
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const localId = parts[parts.length - 2]

    const metadata = await getUploadMetadata(localId)
    if (!metadata) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    if (metadata.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { parts: uploadedParts } = body

    const storageProvider = await getStorageProvider()
    await storageProvider.completeMultipartUpload(
      metadata.fileKey,
      metadata.s3UploadId,
      uploadedParts
    )

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

    return NextResponse.json({
      data: { success: true },
    })
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
