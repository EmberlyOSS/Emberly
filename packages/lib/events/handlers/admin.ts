import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'
import { emit } from '../bullmq/queue'
import type { HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('admin-handler')

export const adminHandlers: HandlerMap = {
  'admin.user-role-changed': [
    async (payload: EventPayload<'admin.user-role-changed'>) => {
      logger.info('User role changed', {
        targetUserId: payload.targetUserId,
        adminUserId: payload.adminUserId,
        oldRole: payload.oldRole,
        newRole: payload.newRole,
      })

      await emit('email.send', {
        to: payload.targetEmail,
        template: 'role-changed',
        subject: 'Your Emberly account role has been updated',
        variables: {
          email: payload.targetEmail,
          oldRole: payload.oldRole,
          newRole: payload.newRole,
          changedAt: new Date().toISOString(),
        },
        userId: payload.targetUserId,
        priority: 'normal',
        sourceEvent: 'admin.user-role-changed',
      })
    },
  ],

  'admin.user-suspended': [
    async (payload: EventPayload<'admin.user-suspended'>) => {
      logger.warn('User suspended', {
        targetUserId: payload.targetUserId,
        adminUserId: payload.adminUserId,
        reason: payload.reason,
        duration: payload.duration,
      })

      const isPermanent = !payload.duration
      const expiresAt = payload.duration
        ? new Date(Date.now() + payload.duration * 60 * 1000)
        : null

      await emit('email.send', {
        to: payload.targetEmail,
        template: 'account-suspended',
        subject: 'Your Emberly account has been suspended',
        variables: {
          email: payload.targetEmail,
          reason: payload.reason,
          isPermanent,
          expiresAt: expiresAt?.toISOString(),
          suspendedAt: new Date().toISOString(),
          appealUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contact`,
        },
        userId: payload.targetUserId,
        priority: 'high',
        sourceEvent: 'admin.user-suspended',
      })
    },
  ],

  'admin.user-unsuspended': [
    async (payload: EventPayload<'admin.user-unsuspended'>) => {
      logger.info('User unsuspended', {
        targetUserId: payload.targetUserId,
        adminUserId: payload.adminUserId,
      })

      await emit('email.send', {
        to: payload.targetEmail,
        template: 'account-unsuspended',
        subject: 'Your Emberly account has been restored',
        variables: {
          email: payload.targetEmail,
          restoredAt: new Date().toISOString(),
        },
        userId: payload.targetUserId,
        priority: 'high',
        sourceEvent: 'admin.user-unsuspended',
      })
    },
  ],

  'admin.content-removed': [
    async (payload: EventPayload<'admin.content-removed'>) => {
      logger.warn('Content removed by admin', {
        contentType: payload.contentType,
        contentId: payload.contentId,
        ownerId: payload.ownerId,
        adminUserId: payload.adminUserId,
        reason: payload.reason,
      })
    },
  ],
}
