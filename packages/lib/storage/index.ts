import { loggers } from '@/packages/lib/logger'

import { prisma } from '@/packages/lib/database/prisma'
import type { StorageBucket } from '@/prisma/generated/prisma/client'
import { getConfig } from '../config/index'
import { LocalStorageProvider } from './providers/local'
import { S3StorageProvider } from './providers/s3'
import type { StorageProvider } from './types'

const logger = loggers.storage

export type { StorageProvider, RangeOptions } from './types'
export { LocalStorageProvider, S3StorageProvider }

/** { bucket record, ready-to-use provider } returned by upload-destination helpers. */
export type UploadDestination = {
  bucket: StorageBucket
  provider: StorageProvider
}

// Stored on globalThis so the singleton survives Next.js hot-reloads in dev mode
const _g = globalThis as typeof globalThis & {
  __storageProvider?: StorageProvider
}
let storageProvider: StorageProvider | null = _g.__storageProvider ?? null

/** Build a provider from a StorageBucket DB record (no caching — used for per-bucket routing). */
function providerFromBucket(bucket: {
  provider: string
  s3Bucket: string
  s3Region: string
  s3AccessKeyId: string
  s3SecretKey: string
  s3Endpoint?: string | null
  s3ForcePathStyle: boolean
}): StorageProvider {
  if (bucket.provider === 's3') {
    return new S3StorageProvider({
      bucket: bucket.s3Bucket,
      region: bucket.s3Region,
      accessKeyId: bucket.s3AccessKeyId,
      secretAccessKey: bucket.s3SecretKey,
      endpoint: bucket.s3Endpoint || undefined,
      forcePathStyle: bucket.s3ForcePathStyle,
    })
  }
  return new LocalStorageProvider()
}

/** The global config-driven provider (singleton). Used as the fallback for legacy files (storageBucketId = null). */
export async function getStorageProvider(): Promise<StorageProvider> {
  if (storageProvider) return storageProvider

  const config = await getConfig()
  const { provider, s3 } = config.settings.general.storage

  if (provider === 's3') {
    try {
      logger.info('Initializing S3 storage provider', {
        bucket: s3.bucket,
        region: s3.region,
        endpoint: s3.endpoint,
      })

      storageProvider = new S3StorageProvider({
        bucket: s3.bucket,
        region: s3.region,
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
        endpoint: s3.endpoint || undefined,
        forcePathStyle: s3.forcePathStyle,
      })

      logger.info('S3 storage provider initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize S3 storage provider', error as Error)
      logger.warn('Falling back to local storage')
      storageProvider = new LocalStorageProvider()
    }
  } else {
    logger.info('Using local storage provider')
    storageProvider = new LocalStorageProvider()
  }

  _g.__storageProvider = storageProvider
  return storageProvider
}

export function invalidateStorageProvider(): void {
  storageProvider = null
  _g.__storageProvider = undefined
}

// ---------------------------------------------------------------------------
// Core bucket selection — least-filled load balancing across internal buckets
// ---------------------------------------------------------------------------

/**
 * Pick the active core bucket with the lowest fileCount.
 * Returns null when no active core buckets are configured; callers fall back
 * to the global config provider in that case.
 */
async function selectCoreBucket(): Promise<UploadDestination | null> {
  const bucket = await prisma.storageBucket.findFirst({
    where: { isCore: true, provisionStatus: 'active' },
    orderBy: [{ fileCount: 'asc' }, { priority: 'desc' }],
  })

  if (!bucket) return null

  return { bucket, provider: providerFromBucket(bucket) }
}

// ---------------------------------------------------------------------------
// Upload-destination helpers — call these from upload routes
// ---------------------------------------------------------------------------

/**
 * Resolve where a new file for this user should be stored.
 *
 * Priority:
 *   1. User's dedicated bucket (storageBucketId on the User record)
 *   2. Least-filled active core bucket
 *   3. null → caller falls back to getStorageProvider()
 */
export async function getUploadBucketForUser(
  userId: string
): Promise<UploadDestination | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageBucketId: true },
  })

  if (user?.storageBucketId) {
    const bucket = await prisma.storageBucket.findUnique({
      where: { id: user.storageBucketId, provisionStatus: 'active' },
    })
    if (bucket) {
      logger.info('Routing upload to user dedicated bucket', {
        userId,
        bucketId: bucket.id,
        bucketName: bucket.name,
      })
      return { bucket, provider: providerFromBucket(bucket) }
    }
  }

  return selectCoreBucket()
}

/**
 * Resolve where a new file for this squad should be stored.
 *
 * Priority:
 *   1. Squad's dedicated bucket
 *   2. Least-filled active core bucket
 *   3. null → caller falls back to getStorageProvider()
 */
export async function getUploadBucketForSquad(
  squadId: string
): Promise<UploadDestination | null> {
  const squad = await prisma.nexiumSquad.findUnique({
    where: { id: squadId },
    select: { storageBucketId: true },
  })

  if (squad?.storageBucketId) {
    const bucket = await prisma.storageBucket.findUnique({
      where: { id: squad.storageBucketId, provisionStatus: 'active' },
    })
    if (bucket) {
      logger.info('Routing upload to squad dedicated bucket', {
        squadId,
        bucketId: bucket.id,
        bucketName: bucket.name,
      })
      return { bucket, provider: providerFromBucket(bucket) }
    }
  }

  return selectCoreBucket()
}

// ---------------------------------------------------------------------------
// Serve-time helper — call this when reading/streaming a stored file
// ---------------------------------------------------------------------------

/**
 * Return the storage provider for an already-stored file.
 *
 * Pass `file.storageBucketId` from the DB record. A null value means the file
 * was stored before bucket routing was introduced and lives in the global
 * config bucket — getStorageProvider() is used as the fallback.
 */
export async function getProviderForStoredFile(
  storageBucketId: string | null | undefined
): Promise<StorageProvider> {
  if (!storageBucketId) return getStorageProvider()

  const bucket = await prisma.storageBucket.findUnique({
    where: { id: storageBucketId },
    select: {
      id: true,
      provider: true,
      s3Bucket: true,
      s3Region: true,
      s3AccessKeyId: true,
      s3SecretKey: true,
      s3Endpoint: true,
      s3ForcePathStyle: true,
    },
  })

  if (!bucket) {
    logger.warn(
      'storageBucketId on file does not match any bucket record — falling back to global provider',
      {
        storageBucketId,
      }
    )
    return getStorageProvider()
  }

  return providerFromBucket(bucket)
}

// ---------------------------------------------------------------------------
// Convenience URL helpers — bucket-aware
// ---------------------------------------------------------------------------

/**
 * Build a public (or presigned) URL for a stored file using its bucket.
 * Pass `storageBucketId` from the File record so the correct provider is used.
 */
export async function getFileUrlForFile(
  storageBucketId: string | null | undefined,
  path: string,
  expiresIn?: number,
  hostOverride?: string
): Promise<string> {
  const provider = await getProviderForStoredFile(storageBucketId)
  return provider.getFileUrl(path, expiresIn, hostOverride)
}

/**
 * Build a download URL for a stored file using its bucket.
 */
export async function getDownloadUrlForFile(
  storageBucketId: string | null | undefined,
  path: string,
  filename?: string,
  hostOverride?: string
): Promise<string> {
  const provider = await getProviderForStoredFile(storageBucketId)
  if (provider.getDownloadUrl) {
    return provider.getDownloadUrl(path, filename, hostOverride)
  }
  return provider.getFileUrl(path, undefined, hostOverride)
}

/**
 * @deprecated Use getFileUrlForFile() so the correct bucket provider is used.
 * Kept for call sites that only deal with the global config bucket.
 */
export async function getFileUrl(
  path: string,
  expiresIn?: number,
  hostOverride?: string
): Promise<string> {
  const provider = await getStorageProvider()
  return provider.getFileUrl(path, expiresIn, hostOverride)
}

/**
 * @deprecated Use getDownloadUrlForFile() so the correct bucket provider is used.
 * Kept for call sites that only deal with the global config bucket.
 */
export async function getDownloadUrl(
  path: string,
  filename?: string,
  hostOverride?: string
): Promise<string> {
  const provider = await getStorageProvider()
  if (provider.getDownloadUrl) {
    return provider.getDownloadUrl(path, filename, hostOverride)
  }
  return provider.getFileUrl(path, undefined, hostOverride)
}
