import { loggers } from '@/lib/logger'

import { getConfig } from '../config/index'
import { LocalStorageProvider } from './providers/local'
import { S3StorageProvider } from './providers/s3'
import type { StorageProvider } from './types'

const logger = loggers.storage

export type { StorageProvider, RangeOptions } from './types'
export { LocalStorageProvider, S3StorageProvider }

let storageProvider: StorageProvider | null = null

export async function getStorageProvider(): Promise<StorageProvider> {
  if (storageProvider) return storageProvider

  const config = await getConfig()
  const { provider, s3 } = config.settings.general.storage

  if (provider === 's3') {
    try {
      // Decide whether to use path-style addressing. If the admin explicitly
      // set `forcePathStyle` use that. Otherwise, default to `true` for custom
      // endpoints (non-AWS) to avoid virtual-host DNS issues like
      // `bucket.custom-endpoint.example` failing to resolve.
      const explicitForce = typeof s3.forcePathStyle === 'boolean'
      const isAwsEndpoint =
        !!s3.endpoint && /(^|\.)amazonaws\.com$/.test(s3.endpoint)
      const forcePathStyle = explicitForce
        ? s3.forcePathStyle
        : !!s3.endpoint && !isAwsEndpoint

      logger.info('Initializing S3 storage provider', {
        bucket: s3.bucket,
        region: s3.region,
        endpoint: s3.endpoint,
        forcePathStyle,
      })

      storageProvider = new S3StorageProvider({
        bucket: s3.bucket,
        region: s3.region,
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
        endpoint: s3.endpoint || undefined,
        forcePathStyle,
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

  return storageProvider
}

export function invalidateStorageProvider(): void {
  storageProvider = null
}
