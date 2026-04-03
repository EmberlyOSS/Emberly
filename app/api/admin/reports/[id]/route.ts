import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import { loggers } from '@/packages/lib/logger'
import { ReportStatus } from '@/prisma/generated/prisma/client'

const logger = loggers.api.getChildLogger('admin-reports-resolve')

const ResolveReportSchema = z.object({
  status: z.nativeEnum(ReportStatus, {
    errorMap: () => ({ message: 'Invalid report status' }),
  }),
  resolution: z.string().max(2000, 'Resolution must be at most 2000 characters').optional(),
  action: z.enum(['banned', 'dismissed', 'warned']).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: adminUser, response } = await requireAdmin()
    if (response) return response

    const { id } = await params

    const existing = await prisma.userReport.findUnique({
      where: { id },
      include: {
        reportedUser: { select: { id: true, name: true } },
      },
    })

    if (!existing) {
      return apiError('Report not found', HTTP_STATUS.NOT_FOUND)
    }

    const json = await req.json()
    const result = ResolveReportSchema.safeParse(json)
    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const { status, resolution, action } = result.data

    const isResolved =
      status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED

    const report = await prisma.userReport.update({
      where: { id },
      data: {
        status,
        ...(resolution !== undefined && { resolution }),
        resolvedById: isResolved ? adminUser.id : undefined,
        resolvedAt: isResolved ? new Date() : undefined,
      },
    })

    if (isResolved) {
      events.emit('moderation.report-resolved', {
        reportId: report.id,
        reportedUserId: existing.reportedUserId,
        adminId: adminUser.id,
        adminName: adminUser.name ?? 'Unknown',
        resolution: resolution ?? '',
        action: action ?? 'dismissed',
      })
    }

    logger.info('Report updated', { reportId: report.id, adminId: adminUser.id, status })

    return apiResponse(report)
  } catch (error) {
    logger.error('Error resolving report', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
