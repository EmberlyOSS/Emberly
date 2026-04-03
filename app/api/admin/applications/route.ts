import { HTTP_STATUS, apiError, paginatedResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { ApplicationStatus, ApplicationType } from '@/prisma/generated/prisma/client'

const logger = loggers.api.getChildLogger('admin-applications')

export async function GET(req: Request) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const skip = (page - 1) * limit

    const rawType = searchParams.get('type')
    const rawStatus = searchParams.get('status')

    const type =
      rawType && Object.values(ApplicationType).includes(rawType as ApplicationType)
        ? (rawType as ApplicationType)
        : undefined

    const status =
      rawStatus && Object.values(ApplicationStatus).includes(rawStatus as ApplicationStatus)
        ? (rawStatus as ApplicationStatus)
        : undefined

    const where = {
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
    }

    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, urlId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    return paginatedResponse(applications, {
      total,
      pageCount: Math.ceil(total / limit),
      page,
      limit,
    })
  } catch (error) {
    logger.error('Error listing applications', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
