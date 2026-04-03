import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { hasPermission, Permission } from '@/packages/lib/permissions'
import { z } from 'zod'

const logger = loggers.api.getChildLogger('application-replies')

const ReplySchema = z.object({
  content: z.string().min(1).max(2000),
})

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
      select: { userId: true },
    })

    if (!application) {
      return apiError('Application not found', HTTP_STATUS.NOT_FOUND)
    }

    const isAdmin = hasPermission(user.role as any, Permission.ACCESS_ADMIN_PANEL)
    if (!isAdmin && application.userId !== user.id) {
      return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
    }

    const replies = await prisma.applicationReply.findMany({
      where: { applicationId: id },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return apiResponse(replies)
  } catch (error) {
    logger.error('Error fetching replies', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const { id } = await params
    const body = await req.json()

    const parsed = ReplySchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Invalid reply content', HTTP_STATUS.BAD_REQUEST)
    }

    const application = await prisma.application.findUnique({
      where: { id },
      select: { userId: true, status: true },
    })

    if (!application) {
      return apiError('Application not found', HTTP_STATUS.NOT_FOUND)
    }

    const isAdmin = hasPermission(user.role as any, Permission.ACCESS_ADMIN_PANEL)
    if (!isAdmin && application.userId !== user.id) {
      return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
    }

    // Only allow replies on non-withdrawn applications
    if (application.status === 'WITHDRAWN') {
      return apiError('Cannot reply to a withdrawn application', HTTP_STATUS.BAD_REQUEST)
    }

    const reply = await prisma.applicationReply.create({
      data: {
        applicationId: id,
        userId: user.id,
        content: parsed.data.content,
        isStaffReply: isAdmin,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    })

    logger.info('Application reply created', {
      applicationId: id,
      replyId: reply.id,
      userId: user.id,
      isStaffReply: isAdmin,
    })

    return apiResponse(reply)
  } catch (error) {
    logger.error('Error creating reply', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
