import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { hasPermission, Permission } from '@/packages/lib/permissions'
import { ApplicationStatus } from '@/prisma/generated/prisma/client'

const logger = loggers.api.getChildLogger('applications-id')

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const { id } = await params

    const application = await prisma.application.findUnique({
      where: { id },
    })

    if (!application) {
      return apiError('Application not found', HTTP_STATUS.NOT_FOUND)
    }

    const isAdmin = hasPermission(user.role as any, Permission.ACCESS_ADMIN_PANEL)
    if (!isAdmin && application.userId !== user.id) {
      return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
    }

    return apiResponse(application)
  } catch (error) {
    logger.error('Error fetching application', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const { id } = await params

    const application = await prisma.application.findUnique({
      where: { id },
    })

    if (!application) {
      return apiError('Application not found', HTTP_STATUS.NOT_FOUND)
    }

    if (application.userId !== user.id) {
      return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
    }

    if (application.status !== ApplicationStatus.PENDING) {
      return apiError('Only pending applications can be withdrawn', HTTP_STATUS.BAD_REQUEST)
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.WITHDRAWN },
    })

    logger.info('Application withdrawn', { applicationId: id, userId: user.id })

    return apiResponse(updated)
  } catch (error) {
    logger.error('Error withdrawing application', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
