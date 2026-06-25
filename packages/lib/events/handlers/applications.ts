import type { EventPayload } from '@/packages/types/events'

import {
  sendTemplateEmail,
  ApplicationStatusEmail,
  ApplicationReplyEmail,
} from '@/packages/lib/emails'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import type { HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('applications-handler')

function formatType(type: string): string {
  const map: Record<string, string> = {
    STAFF: 'Staff',
    PARTNER: 'Partner',
    VERIFICATION: 'Verification',
    BAN_APPEAL: 'Ban Appeal',
  }
  return map[type] ?? type.charAt(0) + type.slice(1).toLowerCase()
}

export const applicationHandlers: HandlerMap = {
  'application.submitted': [
    async (payload: EventPayload<'application.submitted'>) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'
      const applicationType = formatType(payload.type)
      const applicationUrl = `${baseUrl}/applications`

      try {
        await sendTemplateEmail({
          to: payload.userEmail,
          subject: `We received your ${applicationType} application`,
          template: ApplicationStatusEmail,
          props: {
            recipientName: payload.userName,
            applicationType,
            status: 'received',
            applicationUrl,
          },
          skipTracking: true,
        })
        logger.info('Application confirmation sent to user', {
          applicationId: payload.applicationId,
          userId: payload.userId,
        })
      } catch (err: unknown) {
        logger.warn('Failed to send application confirmation to user', {
          applicationId: payload.applicationId,
          error: err instanceof Error ? err.message : String(err),
        })
      }

      try {
        const adminUsers = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'SUPERADMIN'] },
            email: { not: null },
          },
          select: { email: true, name: true },
        })

        const adminApplicationUrl = `${baseUrl}/admin/applications/${payload.applicationId}`

        await Promise.allSettled(
          adminUsers
            .filter((a) => !!a.email)
            .map((admin) =>
              sendTemplateEmail({
                to: admin.email!,
                subject: `New ${applicationType} application — ${payload.userName}`,
                template: ApplicationReplyEmail,
                props: {
                  recipientName: admin.name ?? undefined,
                  replyContent: `A new ${applicationType} application has been submitted by ${payload.userName} (${payload.userEmail}).\n\nApplication ID: ${payload.applicationId}`,
                  senderName: payload.userName,
                  isStaffReply: false,
                  applicationType,
                  applicationUrl: adminApplicationUrl,
                },
                skipTracking: true,
              }).catch((err) =>
                logger.warn('Failed to send new-application email to admin', {
                  adminEmail: admin.email,
                  error: err instanceof Error ? err.message : String(err),
                })
              )
            )
        )

        logger.info('New application alerts sent to admins', {
          applicationId: payload.applicationId,
          adminCount: adminUsers.length,
        })
      } catch (err: unknown) {
        logger.warn('Failed to query admins or send new-application alerts', {
          applicationId: payload.applicationId,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    },
  ],

  'application.reviewed': [
    async (payload: EventPayload<'application.reviewed'>) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'
      const applicationType = formatType(payload.type)
      const applicationUrl = `${baseUrl}/applications`
      const status = payload.status === 'APPROVED' ? 'approved' : 'rejected'

      const subjectMap = {
        approved: `Your ${applicationType} application has been approved!`,
        rejected: `Update on your ${applicationType} application`,
      }

      try {
        await sendTemplateEmail({
          to: payload.userEmail,
          subject: subjectMap[status],
          template: ApplicationStatusEmail,
          props: {
            recipientName: payload.userName,
            applicationType,
            status,
            reviewNotes: payload.reviewNotes,
            applicationUrl,
          },
          skipTracking: true,
        })
        logger.info('Application outcome email sent to user', {
          applicationId: payload.applicationId,
          userId: payload.userId,
          status,
        })
      } catch (err: unknown) {
        logger.warn('Failed to send application outcome email', {
          applicationId: payload.applicationId,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    },
  ],
}
