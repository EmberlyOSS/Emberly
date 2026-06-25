import type { EventPayload } from '@/packages/types/events'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import type { HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('file-handler')

export const fileHandlers: HandlerMap = {
  'file.uploaded': [
    async (payload: EventPayload<'file.uploaded'>) => {
      logger.debug('File uploaded', {
        fileId: payload.fileId,
        userId: payload.userId,
        fileName: payload.fileName,
        size: payload.fileSize,
      })

      try {
        await prisma.user.update({
          where: { id: payload.userId },
          data: { updatedAt: new Date() },
        })
      } catch (error) {
        logger.error('Failed to update user analytics', error as Error, {
          userId: payload.userId,
        })
      }
    },
  ],

  'file.downloaded': [
    async (payload: EventPayload<'file.downloaded'>) => {
      logger.debug('File downloaded', {
        fileId: payload.fileId,
        fileName: payload.fileName,
        downloadedBy: payload.downloadedBy,
      })

      try {
        await prisma.file.update({
          where: { id: payload.fileId },
          data: { downloads: { increment: 1 } },
        })
      } catch (error) {
        logger.error('Failed to increment download count', error as Error, {
          fileId: payload.fileId,
        })
      }
    },
  ],

  'file.deleted': [
    async (payload: EventPayload<'file.deleted'>) => {
      logger.info('File deleted', {
        fileId: payload.fileId,
        userId: payload.userId,
        fileName: payload.fileName,
        size: payload.fileSize,
      })
    },
  ],

  'file.visibility-changed': [
    async (payload: EventPayload<'file.visibility-changed'>) => {
      logger.info('File visibility changed', {
        fileId: payload.fileId,
        userId: payload.userId,
        oldVisibility: payload.oldVisibility,
        newVisibility: payload.newVisibility,
      })
    },
  ],
}
