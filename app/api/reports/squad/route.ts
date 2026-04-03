import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import { loggers } from '@/packages/lib/logger'
import { ReportCategory } from '@/prisma/generated/prisma/client'

const logger = loggers.api.getChildLogger('squad-reports')

const SubmitSquadReportSchema = z.object({
  squadId: z.string().min(1, 'Squad ID is required'),
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
    const result = SubmitSquadReportSchema.safeParse(json)
    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const { squadId, category, reason, details } = result.data

    const squad = await prisma.nexiumSquad.findUnique({
      where: { id: squadId },
      select: { id: true, name: true, ownerUserId: true },
    })

    if (!squad) {
      return apiError('Squad not found', HTTP_STATUS.NOT_FOUND)
    }

    if (squad.ownerUserId === user.id) {
      return apiError('You cannot report your own squad', HTTP_STATUS.BAD_REQUEST)
    }

    const existing = await prisma.squadReport.findUnique({
      where: {
        squadId_reporterUserId: {
          squadId,
          reporterUserId: user.id,
        },
      },
    })

    if (existing) {
      return apiError(
        'You have already submitted a report against this squad',
        HTTP_STATUS.CONFLICT
      )
    }

    const report = await prisma.squadReport.create({
      data: {
        squadId,
        reporterUserId: user.id,
        category,
        reason,
        details,
      },
    })

    events.emit('moderation.squad-reported', {
      reportId: report.id,
      squadId,
      squadName: squad.name,
      reporterUserId: user.id,
      reporterUserName: user.name ?? 'Unknown',
      category,
      reason,
    })

    logger.info('Squad report submitted', { reportId: report.id, reporterUserId: user.id, squadId })

    return apiResponse(report)
  } catch (error) {
    logger.error('Error submitting squad report', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
