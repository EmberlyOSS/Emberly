import { loggers } from '@/packages/lib/logger'

import { prisma } from '@/packages/lib/database/prisma'
import { getConfig } from '../config/index'
import { LocalStorageProvider } from './providers/local'
import { S3StorageProvider } from './providers/s3'
import type { StorageProvider } from './types'

const logger = loggers.storage

export type { StorageProvider, RangeOptions } from './types'
export { LocalStorageProvider, S3StorageProvider }

// Stored on globalThis so the singleton survives Next.js hot-reloads in dev mode
const _g = globalThis as typeof globalThis & {
  __storageProvider?: StorageProvider
}
let storageProvider: StorageProvider | null = _g.__storageProvider ?? null

/** Build a provider from a StorageBucket DB record (no caching — used for per-user routing). */
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

/**
 * Get a storage provider scoped to a specific user.
 * If the user has an assigned `storageBucketId`, returns a provider for that bucket.
 * Otherwise falls back to the global default provider.
 */
export async function getStorageProviderForUser(
  userId: string
): Promise<StorageProvider> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageBucketId: true },
  })

  if (user?.storageBucketId) {
    const bucket = await prisma.storageBucket.findUnique({
      where: { id: user.storageBucketId },
    })
    if (bucket) {
      logger.info('Using custom storage bucket for user', {
        userId,
        bucketId: bucket.id,
        bucketName: bucket.name,
      })
      return providerFromBucket(bucket)
    }
  }

  return getStorageProvider()
}

/**
 * Get a storage provider scoped to a specific squad.
 * If the squad has an assigned `storageBucketId`, returns a provider for that bucket.
 * Otherwise falls back to the global default provider.
 */
export async function getStorageProviderForSquad(
  squadId: string
): Promise<StorageProvider> {
  const squad = await prisma.nexiumSquad.findUnique({
    where: { id: squadId },
    select: { storageBucketId: true },
  })

  if (squad?.storageBucketId) {
    const bucket = await prisma.storageBucket.findUnique({
      where: { id: squad.storageBucketId },
    })
    if (bucket) {
      logger.info('Using custom storage bucket for squad', {
        squadId,
        bucketId: bucket.id,
        bucketName: bucket.name,
      })
      return providerFromBucket(bucket)
    }
  }

  return getStorageProvider()
}

export function invalidateStorageProvider(): void {
  storageProvider = null
  _g.__storageProvider = undefined
}

// ---------------------------------------------------------------------------
// Convenience URL helpers — avoids repeating getStorageProvider() + getFileUrl()
// in every route that only needs a URL.
// ---------------------------------------------------------------------------

/**
 * Build a public (or presigned) URL for a stored file.
 * Delegates to the active provider's `getFileUrl` implementation.
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
 * Build a download URL (with `Content-Disposition: attachment`) for a stored file.
 * Falls back to `getFileUrl` when the provider doesn't implement `getDownloadUrl`.
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
