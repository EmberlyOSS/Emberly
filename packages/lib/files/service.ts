/**
 * File Service Layer
 *
 * Consolidates all file operations: access control, metadata updates, deletion, etc.
 * Reduces duplication across file-related API routes
 *
 * This REPLACES scattered logic in:
 * - app/api/files/[id]/route.ts
 * - app/api/files/[id]/download/route.ts
 * - app/api/files/[id]/ocr/route.ts
 * - app/api/files/[id]/expiry/route.ts
 * - app/api/files/chunks/route.ts
 * - app/api/files/chunks/[uploadId]/complete/route.ts
 */
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { getProviderForStoredFile } from '@/packages/lib/storage'
import { File, Prisma, User } from '@/prisma/generated/prisma/client'
import { compare, hash } from 'bcryptjs'

const logger = loggers.files

/**
 * FileAccessResult - standardized result for file access checks
 */
export interface FileAccessResult {
  allowed: boolean
  reason?: string
  file?: File
}

/**
 * Check if a user has access to a file
 * Handles: ownership, public/private visibility, password protection
 */
export async function verifyFileAccess(
  fileId: string,
  userId: string | null,
  password?: string
): Promise<FileAccessResult> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  })

  if (!file) {
    return { allowed: false, reason: 'File not found' }
  }

  // Owner always has access
  if (file.userId === userId) {
    return { allowed: true, file }
  }

  // Private files - only owner
  if (file.visibility === 'PRIVATE') {
    return { allowed: false, reason: 'File is private', file }
  }

  // Public file with password protection
  if (file.password) {
    if (!password) {
      return { allowed: false, reason: 'Password required', file }
    }

    const passwordMatches = await compare(password, file.password)
    if (!passwordMatches) {
      return { allowed: false, reason: 'Invalid password', file }
    }
  }

  return { allowed: true, file }
}

/**
 * Hash a file password for storage
 */
export async function hashFilePassword(password: string): Promise<string> {
  return hash(password, 10)
}

/**
 * Update file metadata (visibility, password, expiration, name)
 */
export async function updateFileMetadata(
  fileId: string,
  userId: string,
  updates: {
    visibility?: 'PUBLIC' | 'PRIVATE'
    password?: string | null
    name?: string
  }
) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  })

  if (!file) {
    throw new Error('File not found')
  }

  if (file.userId !== userId) {
    throw new Error('Unauthorized')
  }

  const updateData: Prisma.FileUpdateInput = {}

  if (updates.visibility !== undefined) {
    updateData.visibility = updates.visibility
  }

  if (updates.password !== undefined) {
    if (updates.password) {
      updateData.password = await hash(updates.password, 10)
    } else {
      updateData.password = null
    }
  }

  if (updates.name !== undefined) {
    updateData.name = updates.name
  }

  return prisma.file.update({
    where: { id: fileId },
    data: updateData,
  })
}

/**
 * Increment view and/or download count
 */
export async function incrementFileMetrics(
  fileId: string,
  type: 'view' | 'download' = 'view'
) {
  const updateData = {}
  if (type === 'view') {
    Object.assign(updateData, { views: { increment: 1 } })
  } else if (type === 'download') {
    Object.assign(updateData, { downloads: { increment: 1 } })
  }

  return prisma.file.update({
    where: { id: fileId },
    data: updateData,
  })
}

/**
 * Delete a file and clean up storage
 */
export async function deleteFileWithCleanup(
  fileId: string,
  userId: string
): Promise<{
  success: boolean
  error?: string
  deletedStorageBytes?: number
}> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  })

  if (!file || file.userId !== userId) {
    return { success: false, error: 'File not found or unauthorized' }
  }

  try {
    // Delete from storage provider
    const storageProvider = await getProviderForStoredFile(file.storageBucketId)
    await storageProvider.deleteFile(file.path)

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    })

    logger.info('File deleted', {
      fileId,
      userId,
      storageBytes: file.size,
    })

    return {
      success: true,
      deletedStorageBytes: file.size,
    }
  } catch (error) {
    logger.error('Error deleting file', error as Error, { fileId, userId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    }
  }
}

/**
 * Delete multiple files (bulk operation)
 */
export async function deleteFilesWithCleanup(
  fileIds: string[],
  userId: string
): Promise<{
  success: boolean
  deletedCount: number
  failedCount: number
  totalStorageBytes: number
  error?: string
}> {
  let deletedCount = 0
  let failedCount = 0
  let totalStorageBytes = 0

  const files = await prisma.file.findMany({
    where: { id: { in: fileIds }, userId },
  })

  for (const file of files) {
    try {
      const storageProvider = await getProviderForStoredFile(
        file.storageBucketId
      )
      await storageProvider.deleteFile(file.path)
      await prisma.file.delete({ where: { id: file.id } })
      deletedCount++
      totalStorageBytes += file.size
    } catch (error) {
      failedCount++
      logger.warn('Failed to delete file during bulk delete', {
        fileId: file.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  logger.info('Bulk file deletion completed', {
    userId,
    deletedCount,
    failedCount,
    totalStorageBytes,
  })

  return {
    success: failedCount === 0,
    deletedCount,
    failedCount,
    totalStorageBytes,
  }
}

/**
 * Get file with related data
 */
export async function getFileWithRelations(fileId: string) {
  return prisma.file.findUnique({
    where: { id: fileId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          urlId: true,
          image: true,
        },
      },
      collaborators: {
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Check if file meets security requirements
 * (E.g., not quarantined, not flagged as malware)
 */
export async function isFileSecure(fileId: string): Promise<boolean> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      flagged: true,
    },
  })

  if (!file) return false
  return !file.flagged
}

/**
 * List files for a user with pagination
 */
export async function listUserFiles(
  userId: string,
  options: {
    page?: number
    limit?: number
    search?: string
    sortBy?: 'newest' | 'oldest' | 'largest' | 'smallest' | 'name'
    visibility?: 'PUBLIC' | 'PRIVATE'
    types?: string[] // MIME types filter
  } = {}
) {
  const page = options.page || 1
  const limit = Math.min(options.limit || 24, 100)
  const skip = (page - 1) * limit

  const where: Prisma.FileWhereInput = {
    userId,
  }

  if (options.search) {
    where.name = {
      contains: options.search,
      mode: 'insensitive',
    }
  }

  if (options.visibility) {
    where.visibility = options.visibility
  }

  if (options.types?.length) {
    where.mimeType = {
      in: options.types,
    }
  }

  const orderBy: Prisma.FileOrderByWithRelationInput = {}
  switch (options.sortBy) {
    case 'oldest':
      Object.assign(orderBy, { uploadedAt: 'asc' })
      break
    case 'largest':
      Object.assign(orderBy, { size: 'desc' })
      break
    case 'smallest':
      Object.assign(orderBy, { size: 'asc' })
      break
    case 'name':
      Object.assign(orderBy, { name: 'asc' })
      break
    case 'newest':
    default:
      Object.assign(orderBy, { uploadedAt: 'desc' })
  }

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        visibility: true,
        uploadedAt: true,
        views: true,
        downloads: true,
      },
    }),
    prisma.file.count({ where }),
  ])

  return {
    files,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
}

/**
 * Archive a file by hiding it from public access without changing moderation flags.
 */
export async function archiveFile(fileId: string, userId: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  })

  if (!file || file.userId !== userId) {
    throw new Error('File not found or unauthorized')
  }

  return prisma.file.update({
    where: { id: fileId },
    data: { visibility: 'PRIVATE' },
  })
}

/**
 * Restore an archived file to public visibility without changing moderation flags.
 */
export async function restoreFile(fileId: string, userId: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  })

  if (!file || file.userId !== userId) {
    throw new Error('File not found or unauthorized')
  }

  return prisma.file.update({
    where: { id: fileId },
    data: { visibility: 'PUBLIC' },
  })
}
