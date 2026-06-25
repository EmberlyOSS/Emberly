import type { EventPayload } from '@/packages/types/events'
import { ExpiryAction } from '@/packages/types/events'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { getProviderForStoredFile } from '@/packages/lib/storage'
import { eventQueue, emit } from '../bullmq/queue'
import type { HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('file-expiry')

export const fileExpiryHandlers: HandlerMap = {
  'file.schedule-expiration': [
    async (payload: EventPayload<'file.schedule-expiration'>) => {
      logger.info('Scheduling file expiration', {
        fileId: payload.fileId,
        fileName: payload.fileName,
        action: payload.action,
        expiresAt: payload.expiresAt,
      })

      const delay = payload.expiresAt.getTime() - Date.now()
      if (delay <= 0) {
        await emit('file.expired', {
          fileId: payload.fileId,
          userId: payload.userId,
          fileName: payload.fileName,
          filePath: '',
          size: 0,
          action: payload.action,
        })
        return
      }

      await eventQueue.add(
        'file.expired',
        {
          fileId: payload.fileId,
          userId: payload.userId,
          fileName: payload.fileName,
          filePath: '',
          size: 0,
          action: payload.action,
        },
        {
          jobId: `file-expiry-${payload.fileId}`,
          delay,
        }
      )
    },
  ],

  'file.expired': [
    async (payload: EventPayload<'file.expired'>) => {
      try {
        logger.info('Processing file expiration', {
          fileId: payload.fileId,
          fileName: payload.fileName,
          action: payload.action,
        })

        const file = await prisma.file.findUnique({
          where: { id: payload.fileId },
        })

        if (!file) {
          logger.warn('File not found for expiration', {
            fileId: payload.fileId,
          })
          return
        }

        if (payload.action === ExpiryAction.DELETE) {
          const storageProvider = await getProviderForStoredFile(
            file.storageBucketId
          )
          await storageProvider.deleteFile(file.path)
          logger.info('Deleted file from storage', { path: file.path })

          await prisma.user.update({
            where: { id: file.userId },
            data: { storageUsed: { decrement: file.size } },
          })
          logger.info('Updated storage quota for user', {
            userId: file.userId,
            sizeFreed: file.size,
          })

          await prisma.file.delete({ where: { id: payload.fileId } })
          logger.info('Deleted file from database', { fileId: payload.fileId })
        } else if (payload.action === ExpiryAction.SET_PRIVATE) {
          await prisma.file.update({
            where: { id: payload.fileId },
            data: { visibility: 'PRIVATE' },
          })
          logger.info('Set file to private', { fileId: payload.fileId })
        }
      } catch (error) {
        logger.error('Failed to process expired file', error as Error, {
          fileId: payload.fileId,
        })
        throw error
      }
    },
  ],
}

export async function scheduleFileExpiration(
  fileId: string,
  userId: string,
  fileName: string,
  expiresAt: Date,
  action: ExpiryAction = ExpiryAction.DELETE
): Promise<void> {
  const delay = expiresAt.getTime() - Date.now()
  if (delay <= 0) {
    await emit('file.expired', {
      fileId,
      userId,
      fileName,
      filePath: '',
      size: 0,
      action,
    })
    return
  }

  await eventQueue.add(
    'file.expired',
    {
      fileId,
      userId,
      fileName,
      filePath: '',
      size: 0,
      action,
    },
    {
      jobId: `file-expiry-${fileId}`,
      delay,
    }
  )
}

export async function cancelFileExpiration(fileId: string): Promise<boolean> {
  const job = await eventQueue.getJob(`file-expiry-${fileId}`)
  if (!job) return false

  await job.remove()
  return true
}

export async function getFileExpirationInfo(
  fileId: string
): Promise<Date | null> {
  const job = await eventQueue.getJob(`file-expiry-${fileId}`)
  if (!job || !job.opts.delay) return null

  const scheduledAt = new Date(
    (job.timestamp ?? Date.now()) + (job.opts.delay ?? 0)
  )
  return scheduledAt
}

export async function getFileExpirationInfoBatch(
  fileIds: string[]
): Promise<Map<string, Date>> {
  if (fileIds.length === 0) return new Map()

  const result = new Map<string, Date>()
  await Promise.all(
    fileIds.map(async (fileId) => {
      const job = await eventQueue.getJob(`file-expiry-${fileId}`)
      if (job && job.opts.delay) {
        const scheduledAt = new Date(
          (job.timestamp ?? Date.now()) + (job.opts.delay ?? 0)
        )
        result.set(fileId, scheduledAt)
      }
    })
  )
  return result
}
