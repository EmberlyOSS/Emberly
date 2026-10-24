import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'

const logger = loggers.api.getChildLogger('users-search')

/**
 * GET /api/users/search?q=query&limit=10
 * Finds users to invite by username, or by their exact email address.
 * Emails are never returned, so the endpoint can't be used to collect them.
 */
export async function GET(req: Request) {
  const { response } = await requireAuth(req)
  if (response) return response

  const url = new URL(req.url)
  const query = url.searchParams.get('q')?.trim()
  const limit = Math.min(
    Number(url.searchParams.get('limit') ?? '10') || 10,
    20
  )

  if (!query || query.length < 2) {
    return apiError(
      'Query must be at least 2 characters',
      HTTP_STATUS.BAD_REQUEST
    )
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { equals: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
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
