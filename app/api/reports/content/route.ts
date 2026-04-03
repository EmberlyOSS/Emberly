import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import { loggers } from '@/packages/lib/logger'
import { ReportCategory } from '@/prisma/generated/prisma/client'

const logger = loggers.api.getChildLogger('content-reports')

const SubmitContentReportSchema = z.object({
  contentType: z.enum(['FILE', 'URL']),
  contentId: z.string().min(1, 'Content ID is required'),
  category: z.nativeEnum(ReportCategory, {
    errorMap: () => ({ message: 'Invalid report category' }),
  }),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be at most 500 characters'),
  details: z.string().max(2000, 'Details must be at most 2000 characters').optional(),
})

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const json = await req.json()
    const result = SubmitContentReportSchema.safeParse(json)
    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const { contentType, contentId, category, reason, details } = result.data

    // Verify content exists and get owner
    if (contentType === 'FILE') {
      const file = await prisma.file.findUnique({
        where: { id: contentId },
        select: { id: true, userId: true, name: true },
      })
      if (!file) return apiError('File not found', HTTP_STATUS.NOT_FOUND)
      if (file.userId === user.id) {
        return apiError('You cannot report your own content', HTTP_STATUS.BAD_REQUEST)
      }

      const report = await prisma.contentReport.create({
        data: {
          contentType,
          fileId: contentId,
          reporterUserId: user.id,
          category,
          reason,
          details,
        },
      })

      events.emit('moderation.content-reported', {
        reportId: report.id,
        contentType,
        contentId,
        contentName: file.name,
        reporterUserId: user.id,
        reporterUserName: user.name ?? 'Unknown',
        category,
        reason,
      })

      logger.info('Content report submitted', { reportId: report.id, contentType, contentId })
      return apiResponse(report)
    }

    if (contentType === 'URL') {
      const url = await prisma.shortenedUrl.findUnique({
        where: { id: contentId },
        select: { id: true, userId: true, shortCode: true, targetUrl: true },
      })
      if (!url) return apiError('URL not found', HTTP_STATUS.NOT_FOUND)
      if (url.userId === user.id) {
        return apiError('You cannot report your own content', HTTP_STATUS.BAD_REQUEST)
      }

      const report = await prisma.contentReport.create({
        data: {
          contentType,
          urlId: contentId,
          reporterUserId: user.id,
          category,
          reason,
          details,
        },
      })

      events.emit('moderation.content-reported', {
        reportId: report.id,
        contentType,
        contentId,
        contentName: url.shortCode,
        reporterUserId: user.id,
        reporterUserName: user.name ?? 'Unknown',
        category,
        reason,
      })

      logger.info('Content report submitted', { reportId: report.id, contentType, contentId })
      return apiResponse(report)
    }

    return apiError('Invalid content type', HTTP_STATUS.BAD_REQUEST)
  } catch (error) {
    logger.error('Error submitting content report', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
