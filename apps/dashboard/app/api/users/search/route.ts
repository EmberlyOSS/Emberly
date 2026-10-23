import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'

const logger = loggers.api.getChildLogger('users-search')

/**
 * GET /api/users/search?q=query&limit=10
 * Search for users by name or email
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const query = url.searchParams.get('q')?.trim()
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '10'), 50)

  if (!query || query.length < 1) {
    return apiError(
      'Query must be at least 1 character',
      HTTP_STATUS.BAD_REQUEST
    )
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        urlId: true,
      },
      take: limit,
    })

    return apiResponse({ users })
  } catch (error) {
    logger.error('User search failed', error as Error)
    return apiError('Search failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
