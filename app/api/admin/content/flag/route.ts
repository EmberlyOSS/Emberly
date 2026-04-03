import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api.getChildLogger('admin-content-flag')

const FlagSchema = z.object({
  contentType: z.enum(['file', 'url']),
  contentId: z.string().min(1, 'Content ID is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
  flagged: z.boolean(),
})

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return apiError('Unauthorized', HTTP_STATUS.FORBIDDEN)
    }

    const json = await req.json()
    const result = FlagSchema.safeParse(json)
    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const { contentType, contentId, reason, flagged } = result.data

    if (contentType === 'file') {
      const file = await prisma.file.findUnique({ where: { id: contentId } })
      if (!file) return apiError('File not found', HTTP_STATUS.NOT_FOUND)

      const updated = await prisma.file.update({
        where: { id: contentId },
        data: {
          flagged,
          flaggedAt: flagged ? new Date() : null,
          flaggedById: flagged ? user.id : null,
          flagReason: flagged ? reason : null,
        },
      })

      logger.info(`File ${flagged ? 'flagged' : 'unflagged'}`, {
        fileId: contentId,
        adminId: user.id,
        reason,
      })

      return apiResponse({ id: updated.id, flagged: updated.flagged })
    }

    if (contentType === 'url') {
      const url = await prisma.shortenedUrl.findUnique({ where: { id: contentId } })
      if (!url) return apiError('URL not found', HTTP_STATUS.NOT_FOUND)

      const updated = await prisma.shortenedUrl.update({
        where: { id: contentId },
        data: {
          flagged,
          flaggedAt: flagged ? new Date() : null,
          flaggedById: flagged ? user.id : null,
          flagReason: flagged ? reason : null,
        },
      })

      logger.info(`URL ${flagged ? 'flagged' : 'unflagged'}`, {
        urlId: contentId,
        adminId: user.id,
        reason,
      })

      return apiResponse({ id: updated.id, flagged: updated.flagged })
    }

    return apiError('Invalid content type', HTTP_STATUS.BAD_REQUEST)
  } catch (error) {
    logger.error('Error flagging content', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
