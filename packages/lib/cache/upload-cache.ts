import { loggers } from '@/packages/lib/logger'

import { getRedisClient, isRedisConnected, redisKeys } from './redis'

const logger = loggers.events.getChildLogger('upload-cache')

export interface UploadMetadata {
    fileKey: string
    filename: string
    mimeType: string
    totalSize: number
    userId: string
    visibility: 'PUBLIC' | 'PRIVATE'
    password: string | null
    lastActivity: number
    urlPath: string
    s3UploadId: string
    domain?: string | null
}

// TTL for upload metadata (1 hour)
const UPLOAD_TTL_SECONDS = 60 * 60

/**
 * Redis-based upload metadata cache for chunked uploads
 */
export const uploadCache = {
    /**
     * Save upload metadata
     */
    async save(uploadId: string, metadata: UploadMetadata): Promise<boolean> {
        if (!isRedisConnected()) {
            logger.warn('Redis not connected, cannot save upload metadata')
            return false
        }

        try {
            const redis = await getRedisClient()
            const key = redisKeys.uploadMetadata(uploadId)
            const data = JSON.stringify(metadata)

            // Set with TTL
            await redis.setEx(key, UPLOAD_TTL_SECONDS, data)

            // Add to active uploads set for cleanup tracking
            await redis.sAdd(redisKeys.uploadList(), uploadId)

            logger.debug('Upload metadata saved', { uploadId })
            return true
        } catch (error) {
            logger.error('Failed to save upload metadata', error as Error, { uploadId })
            return false
        }
    },

    /**
     * Get upload metadata
     */
    async get(uploadId: string): Promise<UploadMetadata | null> {
        if (!isRedisConnected()) {
            return null
        }

        try {
            const redis = await getRedisClient()
            const key = redisKeys.uploadMetadata(uploadId)
            const data = await redis.get(key)

            if (!data) return null
            return JSON.parse(data) as UploadMetadata
        } catch (error) {
            logger.error('Failed to get upload metadata', error as Error, { uploadId })
            return null
        }
    },

    /**
     * Update upload metadata (refreshes TTL)
     */
    async update(uploadId: string, updates: Partial<UploadMetadata>): Promise<boolean> {
        if (!isRedisConnected()) {
            return false
        }

        try {
            const existing = await this.get(uploadId)
            if (!existing) return false

            const updated = { ...existing, ...updates, lastActivity: Date.now() }
            return await this.save(uploadId, updated)
        } catch (error) {
            logger.error('Failed to update upload metadata', error as Error, { uploadId })
            return false
        }
    },

    /**
     * Delete upload metadata
     */
    async delete(uploadId: string): Promise<boolean> {
        if (!isRedisConnected()) {
            return false
        }

        try {
            const redis = await getRedisClient()
            const key = redisKeys.uploadMetadata(uploadId)

            await redis.del(key)
            await redis.sRem(redisKeys.uploadList(), uploadId)

            logger.debug('Upload metadata deleted', { uploadId })
            return true
        } catch (error) {
            logger.error('Failed to delete upload metadata', error as Error, { uploadId })
            return false
        }
    },

    /**
     * Clean up stale uploads (older than TTL)
     */
    async cleanup(): Promise<number> {
        if (!isRedisConnected()) {
            return 0
        }

        try {
            const redis = await getRedisClient()
            const uploadIds = await redis.sMembers(redisKeys.uploadList())
            let cleaned = 0

            for (const uploadId of uploadIds) {
                const exists = await redis.exists(redisKeys.uploadMetadata(uploadId))
                if (!exists) {
                    // Key expired, remove from set
                    await redis.sRem(redisKeys.uploadList(), uploadId)
                    cleaned++
                }
            }

            if (cleaned > 0) {
                logger.info('Cleaned up stale upload entries', { cleaned })
            }
            return cleaned
        } catch (error) {
            logger.error('Failed to cleanup uploads', error as Error)
            return 0
        }
    },

    /**
     * Get all active upload IDs
     */
    async getActiveUploads(): Promise<string[]> {
        if (!isRedisConnected()) {
            return []
        }

        try {
            const redis = await getRedisClient()
            return await redis.sMembers(redisKeys.uploadList())
        } catch (error) {
            logger.error('Failed to get active uploads', error as Error)
            return []
        }
    },
}
