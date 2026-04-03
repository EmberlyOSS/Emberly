import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { UserRole } from '@/prisma/generated/prisma/client'

const logger = loggers.api.getChildLogger('reports-get')

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const { id } = await params

    const report = await prisma.userReport.findUnique({
      where: { id },
      include: {
        reportedUser: { select: { id: true, name: true, urlId: true } },
        reporterUser: { select: { id: true, name: true, urlId: true } },
      },
    })

    if (!report) {
      return apiError('Report not found', HTTP_STATUS.NOT_FOUND)
    }

    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN
    const isReporter = report.reporterUserId === user.id

    if (!isAdmin && !isReporter) {
      return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
    }

    return apiResponse(report)
  } catch (error) {
    logger.error('Error fetching report', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
