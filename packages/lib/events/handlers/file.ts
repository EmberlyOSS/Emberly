import type { EventPayload } from '@/packages/types/events'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

import { events } from '../index'

const logger = loggers.events.getChildLogger('file-handler')

/**
 * Register file event handlers (beyond expiry which is in file-expiry.ts)
 */
export function registerFileHandlers(): void {
    // ─────────────────────────────────────────────────────────────────────────────
    // File uploaded
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'file.uploaded',
        'update-analytics',
        async (payload: EventPayload<'file.uploaded'>) => {
            logger.debug('File uploaded', {
                fileId: payload.fileId,
                userId: payload.userId,
                fileName: payload.fileName,
                size: payload.fileSize,
            })

            // Update user's upload count for analytics
            try {
                await prisma.user.update({
                    where: { id: payload.userId },
                    data: {
                        // Assuming you have these fields; adjust as needed
                        // totalUploads: { increment: 1 },
                        // lastUploadAt: new Date(),
                        updatedAt: new Date(),
                    },
                })
            } catch (error) {
                logger.error('Failed to update user analytics', error as Error, {
                    userId: payload.userId,
                })
            }
        },
        { enabled: true, timeout: 10000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // File downloaded
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'file.downloaded',
        'track-download',
        async (payload: EventPayload<'file.downloaded'>) => {
            logger.debug('File downloaded', {
                fileId: payload.fileId,
                fileName: payload.fileName,
                downloadedBy: payload.downloadedBy,
            })

            // Increment download count on file
            try {
                await prisma.file.update({
                    where: { id: payload.fileId },
                    data: {
                        downloads: { increment: 1 },
                    },
                })
            } catch (error) {
                logger.error('Failed to increment download count', error as Error, {
                    fileId: payload.fileId,
                })
            }
        },
        { enabled: true, timeout: 10000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // File deleted
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'file.deleted',
        'update-quota',
        async (payload: EventPayload<'file.deleted'>) => {
            logger.info('File deleted', {
                fileId: payload.fileId,
                userId: payload.userId,
                fileName: payload.fileName,
                size: payload.fileSize,
            })

            // Storage quota is typically updated at delete time in the API,
            // but this handler can be used for additional cleanup or logging
        },
        { enabled: true, timeout: 10000 }
    )

    // ─────────────────────────────────────────────────────────────────────────────
    // File visibility changed
    // ─────────────────────────────────────────────────────────────────────────────

    events.on(
        'file.visibility-changed',
        'log-change',
        async (payload: EventPayload<'file.visibility-changed'>) => {
            logger.info('File visibility changed', {
                fileId: payload.fileId,
                userId: payload.userId,
                oldVisibility: payload.oldVisibility,
                newVisibility: payload.newVisibility,
            })

            // Could trigger cache invalidation or CDN purge here
        },
        { enabled: true, timeout: 5000 }
    )

    logger.debug('File event handlers registered')
}
