import { NextResponse } from 'next/server'

import archiver from 'archiver'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { PassThrough } from 'node:stream'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { S3StorageProvider, getStorageProvider } from '@/packages/lib/storage'
import type { StorageProvider } from '@/packages/lib/storage'
import { clearProgress, updateProgress } from '@/packages/lib/utils'

const logger = loggers.users

type FileData = {
  name: string
  mimeType: string
  size: number
  visibility: 'PUBLIC' | 'PRIVATE'
  uploadedAt: Date
  isOcrProcessed: boolean
  ocrText: string | null
  isPaste: boolean
  path: string
}

type ShortenedUrlData = {
  shortCode: string
  targetUrl: string
  clicks: number
  createdAt: Date
}

type UserData = {
  id: string
  name: string | null
  email: string | null
  createdAt: Date
  updatedAt: Date
  files: FileData[]
  shortenedUrls: ShortenedUrlData[]
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const maxDuration = 300 // 5 minutes max

export async function GET(req: Request) {
  let exportDir: string | null = null
  let userId: string | null = null

  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    userId = user.id
    updateProgress(userId, 0)

    const timestamp = Date.now()
    exportDir = join(process.cwd(), 'tmp', 'exports', `${userId}_${timestamp}`)
    await mkdir(exportDir, { recursive: true })

    const storageProvider = await getStorageProvider()
    const isS3Storage = storageProvider instanceof S3StorageProvider

    logger.info(`Starting data export for user ${userId}, storage: ${isS3Storage ? 'S3' : 'local'}`)

    // Fetch user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        files: {
          select: {
            name: true,
            mimeType: true,
            size: true,
            visibility: true,
            uploadedAt: true,
            isOcrProcessed: true,
            ocrText: true,
            isPaste: true,
            path: true,
          },
        },
        shortenedUrls: {
          select: {
            shortCode: true,
            targetUrl: true,
            clicks: true,
            createdAt: true,
          },
        },
      },
    })

    if (!userData) {
      clearProgress(userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    updateProgress(userId, 10)

    // Prepare user data JSON
    const userDataForExport: UserData = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      files: userData.files,
      shortenedUrls: userData.shortenedUrls,
    }

    const userDataPath = join(exportDir, 'user-data.json')
    await writeFile(userDataPath, JSON.stringify(userDataForExport, null, 2))

    updateProgress(userId, 15)

    // Create archive
    const archive = archiver('zip', { zlib: { level: 6 } })
    const passthrough = new PassThrough()

    // Track archive events
    let archiveFinished = false
    let archiveError: Error | null = null

    archive.on('warning', (err) => {
      logger.warn('Archive warning', { error: err.message })
    })

    archive.on('error', (err) => {
      archiveError = err
      logger.error('Archive error:', err)
    })

    archive.on('end', () => {
      archiveFinished = true
      logger.info(`Archive finished for user ${userId}`)
    })

    // Pipe archive to passthrough stream
    archive.pipe(passthrough)

    // Add user data JSON
    archive.file(userDataPath, { name: 'user-data.json' })

    // Process files
    const totalFiles = userData.files.length
    let processedFiles = 0

    if (totalFiles > 0) {
      for (const file of userData.files) {
        try {
          let fileBuffer: Buffer | null = null

          if (isS3Storage) {
            // Download from S3
            try {
              fileBuffer = await getFileContentFromStorage(storageProvider, file.path)
            } catch (downloadErr) {
              logger.warn(`Skipping S3 file ${file.name}: ${(downloadErr as Error).message}`)
              processedFiles++
              continue
            }
          } else {
            // Local storage - try multiple possible paths
            const possiblePaths = [
              file.path,
              join(process.cwd(), file.path),
              join(process.cwd(), 'uploads', file.path.replace(/^.*uploads[/\\]/, '')),
              join(process.cwd(), file.path.replace(/^\//, '')),
            ]

            let localPath: string | null = null
            for (const p of possiblePaths) {
              if (existsSync(p)) {
                localPath = p
                break
              }
            }

            if (!localPath) {
              logger.warn(`Skipping local file ${file.name}: not found in any expected location`)
              processedFiles++
              continue
            }

            // Check file size before reading
            try {
              const fileStats = await stat(localPath)
              // Skip files larger than 100MB to prevent memory issues
              if (fileStats.size > 100 * 1024 * 1024) {
                logger.warn(`Skipping large file ${file.name}: ${fileStats.size} bytes`)
                processedFiles++
                continue
              }

              // Add file directly from path (more efficient than reading into memory)
              const datePrefix = new Date(file.uploadedAt).toISOString().split('T')[0]
              archive.file(localPath, { name: `files/${datePrefix}/${file.name}` })
              processedFiles++

              const progress = 15 + Math.round((processedFiles / totalFiles) * 80)
              updateProgress(userId, progress)
              continue
            } catch (readErr) {
              logger.warn(`Error reading local file ${file.name}: ${(readErr as Error).message}`)
              processedFiles++
              continue
            }
          }

          // For S3 files, append buffer to archive
          if (fileBuffer) {
            const datePrefix = new Date(file.uploadedAt).toISOString().split('T')[0]
            archive.append(fileBuffer, { name: `files/${datePrefix}/${file.name}` })
          }

          processedFiles++
          const progress = 15 + Math.round((processedFiles / totalFiles) * 80)
          updateProgress(userId, progress)
        } catch (fileErr) {
          logger.warn(`Error processing file ${file.name}: ${(fileErr as Error).message}`)
          processedFiles++
        }
      }
    }

    updateProgress(userId, 95)

    // Finalize archive
    archive.finalize()

    // Wait for archive to finish with proper error handling
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Archive finalization timeout'))
      }, 120000) // 2 minute timeout

      const checkFinished = () => {
        if (archiveFinished) {
          clearTimeout(timeout)
          resolve()
        } else if (archiveError) {
          clearTimeout(timeout)
          reject(archiveError)
        }
      }

      // Check immediately
      checkFinished()

      // Also listen for events
      archive.on('end', () => {
        archiveFinished = true
        clearTimeout(timeout)
        resolve()
      })

      archive.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })

    updateProgress(userId, 100)

    // Schedule cleanup
    const currentExportDir = exportDir
    const currentUserId = userId
    setTimeout(async () => {
      try {
        if (currentExportDir) {
          await rm(currentExportDir, { recursive: true, force: true })
          logger.info(`Export cleanup completed for user ${currentUserId}`)
        }
      } catch (cleanupError) {
        logger.warn('Error cleaning up export directory:', { error: (cleanupError as Error).message })
      }
      if (currentUserId) {
        clearProgress(currentUserId)
      }
    }, 30000) // 30 second delay for cleanup

    // Create response headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="emberly-data-export-${timestamp}.zip"`)
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    // Convert Node stream to web stream
    const webStream = new ReadableStream({
      start(controller) {
        passthrough.on('data', (chunk) => {
          try {
            controller.enqueue(new Uint8Array(chunk))
          } catch {
            // Controller may be closed
          }
        })
        passthrough.on('end', () => {
          try {
            controller.close()
          } catch {
            // Controller may already be closed
          }
        })
        passthrough.on('error', (err) => {
          try {
            controller.error(err)
          } catch {
            // Controller may already be closed
          }
        })
      },
    })

    return new Response(webStream, { headers })
  } catch (error) {
    logger.error('Data export error:', error as Error)

    if (userId) {
      clearProgress(userId)
    }
    if (exportDir) {
      try {
        await rm(exportDir, { recursive: true, force: true })
      } catch {
        // Ignore cleanup errors
      }
    }

    return NextResponse.json(
      { error: 'Export failed. Please try again.' },
      { status: 500 }
    )
  }
}

async function getFileContentFromStorage(
  storageProvider: StorageProvider,
  filePath: string
): Promise<Buffer> {
  const fileStream = await storageProvider.getFileStream(filePath)
  const chunks: Buffer[] = []
  let totalSize = 0
  const maxSize = 100 * 1024 * 1024 // 100MB limit

  for await (const chunk of fileStream) {
    totalSize += chunk.length
    if (totalSize > maxSize) {
      throw new Error(`File exceeds maximum size limit of 100MB`)
    }
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}
