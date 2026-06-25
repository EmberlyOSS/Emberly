import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'
import { emit } from '../bullmq/queue'
import type { HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('account-handler')

export const accountHandlers: HandlerMap = {
  'account.created': [
    async (payload: EventPayload<'account.created'>) => {
      logger.info('Account created', {
        userId: payload.userId,
        method: payload.method,
      })
    },
  ],

  'account.email-verification-requested': [
    async (payload: EventPayload<'account.email-verification-requested'>) => {
      logger.info('Email verification requested', { userId: payload.userId })

      await emit('email.send', {
        to: payload.email,
        template: 'verify-email',
        subject: 'Verify your Emberly email address',
        variables: {
          email: payload.email,
          verifyToken: payload.token,
          expiresAt: payload.expiresAt.toISOString(),
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'account.email-verification-requested',
      })
    },
  ],

  'account.email-verified': [
    async (payload: EventPayload<'account.email-verified'>) => {
      logger.info('Email verified', {
        userId: payload.userId,
        email: payload.email,
      })
    },
  ],

  'account.email-changed': [
    async (payload: EventPayload<'account.email-changed'>) => {
      logger.info('Email changed', {
        userId: payload.userId,
        oldEmail: payload.oldEmail,
        newEmail: payload.newEmail,
      })

      await emit('email.send', {
        to: payload.oldEmail,
        template: 'email-changed-old',
        subject: 'Your Emberly email address was changed',
        variables: {
          oldEmail: payload.oldEmail,
          newEmail: payload.newEmail,
          changedAt: new Date().toISOString(),
          changedBy: payload.changedBy,
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'account.email-changed',
      })

      await emit('email.send', {
        to: payload.newEmail,
        template: 'email-changed-new',
        subject: 'Welcome to your new Emberly email',
        variables: {
          oldEmail: payload.oldEmail,
          newEmail: payload.newEmail,
          changedAt: new Date().toISOString(),
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'account.email-changed',
      })
    },
  ],

  'account.export-requested': [
    async (payload: EventPayload<'account.export-requested'>) => {
      logger.info('Data export requested', {
        userId: payload.userId,
        exportId: payload.exportId,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'export-requested',
        subject: 'Your Emberly data export is being prepared',
        variables: {
          email: payload.email,
          exportId: payload.exportId,
          requestedAt: new Date().toISOString(),
        },
        userId: payload.userId,
        priority: 'normal',
        sourceEvent: 'account.export-requested',
      })
    },
  ],

  'account.export-completed': [
    async (payload: EventPayload<'account.export-completed'>) => {
      logger.info('Data export completed', {
        userId: payload.userId,
        exportId: payload.exportId,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'export-completed',
        subject: 'Your Emberly data export is ready',
        variables: {
          email: payload.email,
          exportId: payload.exportId,
          downloadUrl: payload.downloadUrl,
          expiresAt: payload.expiresAt?.toISOString(),
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'account.export-completed',
      })
    },
  ],

  'account.deletion-requested': [
    async (payload: EventPayload<'account.deletion-requested'>) => {
      logger.warn('Account deletion requested', {
        userId: payload.userId,
        scheduledAt: payload.scheduledAt,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'deletion-requested',
        subject: 'Your Emberly account is scheduled for deletion',
        variables: {
          email: payload.email,
          scheduledAt: payload.scheduledAt.toISOString(),
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/me?cancel-deletion=true`,
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'account.deletion-requested',
      })
    },
  ],

  'account.deletion-cancelled': [
    async (payload: EventPayload<'account.deletion-cancelled'>) => {
      logger.info('Account deletion cancelled', { userId: payload.userId })

      await emit('email.send', {
        to: payload.email,
        template: 'deletion-cancelled',
        subject: 'Your Emberly account deletion was cancelled',
        variables: {
          email: payload.email,
          cancelledAt: new Date().toISOString(),
        },
        userId: payload.userId,
        priority: 'normal',
        sourceEvent: 'account.deletion-cancelled',
      })
    },
  ],

  'account.deleted': [
    async (payload: EventPayload<'account.deleted'>) => {
      logger.info('Account deleted', {
        userId: payload.userId,
        deletedBy: payload.deletedBy,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'account-deleted',
        subject: 'Your Emberly account has been deleted',
        variables: {
          email: payload.email,
          deletedAt: new Date().toISOString(),
          reason: payload.reason,
        },
        priority: 'normal',
        sourceEvent: 'account.deleted',
      })
    },
  ],
}
