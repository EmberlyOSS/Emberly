import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import { loggers } from '@/packages/lib/logger'
import { ReportCategory } from '@/prisma/generated/prisma/client'

const logger = loggers.api.getChildLogger('reports')

const SubmitReportSchema = z.object({
  reportedUserId: z.string().min(1, 'Reported user ID is required'),
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
    const result = SubmitReportSchema.safeParse(json)
    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const { reportedUserId, category, reason, details } = result.data

    if (reportedUserId === user.id) {
      return apiError('You cannot report yourself', HTTP_STATUS.BAD_REQUEST)
    }

    const reportedUser = await prisma.user.findUnique({
      where: { id: reportedUserId },
      select: { id: true, name: true },
    })

    if (!reportedUser) {
      return apiError('Reported user not found', HTTP_STATUS.NOT_FOUND)
    }

    const existing = await prisma.userReport.findUnique({
      where: {
        reportedUserId_reporterUserId: {
          reportedUserId,
          reporterUserId: user.id,
        },
      },
    })

    if (existing) {
      return apiError(
        'You have already submitted a report against this user',
        HTTP_STATUS.CONFLICT
      )
    }

    const report = await prisma.userReport.create({
      data: {
        reportedUserId,
        reporterUserId: user.id,
        category,
        reason,
        details,
      },
    })

    events.emit('moderation.user-reported', {
      reportId: report.id,
      reportedUserId,
      reportedUserName: reportedUser.name ?? 'Unknown',
      reporterUserId: user.id,
      reporterUserName: user.name ?? 'Unknown',
      category,
      reason,
    })

    logger.info('User report submitted', { reportId: report.id, reporterUserId: user.id, reportedUserId })

    return apiResponse(report)
  } catch (error) {
    logger.error('Error submitting report', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
