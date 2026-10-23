import { appUrl } from '@/lib/config/env'
import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { sendTemplateEmail, ApplicationReplyEmail } from '@/lib/emails'
import { loggers } from '@/lib/logger'
import { hasPermission, Permission } from '@/lib/permissions'
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
      select: { userId: true, status: true, type: true },
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

    // ── Send email notifications (fire-and-forget) ──────────────────────────
    const appBaseUrl = appUrl()
    const applicationType =
      application.type.charAt(0) + application.type.slice(1).toLowerCase()

    if (isAdmin) {
      // Staff replied → notify the applicant
      const applicant = await prisma.user.findUnique({
        where: { id: application.userId },
        select: { email: true, name: true },
      })
      if (applicant?.email) {
        sendTemplateEmail({
          to: applicant.email,
          subject: `New reply on your ${applicationType} application`,
          template: ApplicationReplyEmail,
          props: {
            recipientName: applicant.name ?? undefined,
            replyContent: parsed.data.content,
            senderName: user.name ?? 'Emberly Staff',
            isStaffReply: true,
            applicationType,
            applicationUrl: `${appBaseUrl}/applications`,
          },
        }).catch((err) =>
          logger.warn('Failed to send reply email to applicant', { error: err?.message }),
        )
      }
    } else {
      // Applicant replied → notify all admins/superadmins
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPERADMIN'] }, email: { not: null } },
        select: { email: true, name: true },
      })
      for (const admin of admins) {
        if (!admin.email) continue
        sendTemplateEmail({
          to: admin.email,
          subject: `Applicant reply — ${applicationType} application`,
          template: ApplicationReplyEmail,
          props: {
            recipientName: admin.name ?? undefined,
            replyContent: parsed.data.content,
            senderName: user.name ?? 'Applicant',
            isStaffReply: false,
            applicationType,
            applicationUrl: `${appBaseUrl}/admin/applications/${id}`,
          },
        }).catch((err) =>
          logger.warn('Failed to send reply email to admin', { error: err?.message }),
        )
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    return apiResponse(reply)
  } catch (error) {
    logger.error('Error creating reply', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
