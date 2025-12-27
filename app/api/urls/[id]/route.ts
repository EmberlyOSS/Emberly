import { HTTP_STATUS, apiError } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const { id } = await params

    const url = await prisma.shortenedUrl.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!url) {
      return apiError('URL not found', HTTP_STATUS.NOT_FOUND)
    }

    if (url.userId !== user.id) {
      return apiError('Unauthorized', HTTP_STATUS.FORBIDDEN)
    }

    await prisma.shortenedUrl.delete({
      where: { id },
    })

    return new Response(null, { status: HTTP_STATUS.NO_CONTENT })
  } catch (error) {
    logger.error('URL deletion error', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
