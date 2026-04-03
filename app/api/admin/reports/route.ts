import { HTTP_STATUS, apiError, paginatedResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { ReportCategory, ReportStatus } from '@/prisma/generated/prisma/client'

const logger = loggers.api.getChildLogger('admin-reports')

export async function GET(req: Request) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const skip = (page - 1) * limit

    const rawStatus = searchParams.get('status')
    const rawCategory = searchParams.get('category')

    const status =
      rawStatus && Object.values(ReportStatus).includes(rawStatus as ReportStatus)
        ? (rawStatus as ReportStatus)
        : undefined

    const category =
      rawCategory && Object.values(ReportCategory).includes(rawCategory as ReportCategory)
        ? (rawCategory as ReportCategory)
        : undefined

    const where = {
      ...(status !== undefined && { status }),
      ...(category !== undefined && { category }),
    }

    const [total, reports] = await Promise.all([
      prisma.userReport.count({ where }),
      prisma.userReport.findMany({
        where,
        include: {
          reportedUser: { select: { id: true, name: true, email: true, urlId: true } },
          reporterUser: { select: { id: true, name: true, email: true, urlId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    return paginatedResponse(reports, {
      total,
      pageCount: Math.ceil(total / limit),
      page,
      limit,
    })
  } catch (error) {
    logger.error('Error listing reports', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
