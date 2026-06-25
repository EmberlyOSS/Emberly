import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'
import { emit } from '../bullmq/queue'
import type { HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('auth-handler')

export const authHandlers: HandlerMap = {
  'auth.login': [
    async (payload: EventPayload<'auth.login'>) => {
      if (!payload.success) {
        logger.debug('Login failed, skipping new device check', {
          userId: payload.userId,
          reason: payload.failureReason,
        })
        return
      }

      if (payload.isNewDevice) {
        logger.info('New device login detected', {
          userId: payload.userId,
          ip: payload.context?.ip,
          userAgent: payload.context?.userAgent,
        })

        await emit('email.send', {
          to: payload.email,
          template: 'new-device-login',
          subject: 'New device login to your Emberly account',
          variables: {
            email: payload.email,
            ip: payload.context?.ip || 'Unknown',
            userAgent: payload.context?.userAgent || 'Unknown',
            location: payload.context?.geo?.city
              ? `${payload.context.geo.city}, ${payload.context.geo.country}`
              : 'Unknown location',
            loginTime: new Date().toISOString(),
          },
          userId: payload.userId,
          priority: 'high',
          sourceEvent: 'auth.login',
        })
      }
    },
  ],

  'auth.password-changed': [
    async (payload: EventPayload<'auth.password-changed'>) => {
      logger.info('Password changed', {
        userId: payload.userId,
        changedBy: payload.changedBy,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'password-changed',
        subject: 'Your Emberly password was changed',
        variables: {
          email: payload.email,
          changedBy: payload.changedBy,
          changedAt: new Date().toISOString(),
          ip: payload.context?.ip || 'Unknown',
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'auth.password-changed',
      })
    },
  ],

  'auth.password-reset-requested': [
    async (payload: EventPayload<'auth.password-reset-requested'>) => {
      logger.info('Password reset requested', { userId: payload.userId })

      await emit('email.send', {
        to: payload.email,
        template: 'password-reset',
        subject: 'Reset your Emberly password',
        variables: {
          email: payload.email,
          resetToken: payload.token,
          expiresAt: payload.expiresAt.toISOString(),
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'auth.password-reset-requested',
      })
    },
  ],

  'auth.2fa-enabled': [
    async (payload: EventPayload<'auth.2fa-enabled'>) => {
      logger.info('2FA enabled', {
        userId: payload.userId,
        method: payload.method,
      })

      await emit('email.send', {
        to: payload.email,
        template: '2fa-enabled',
        subject: 'Two-factor authentication enabled on your Emberly account',
        variables: {
          email: payload.email,
          method: payload.method,
          enabledAt: new Date().toISOString(),
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'auth.2fa-enabled',
      })
    },
  ],

  'auth.2fa-disabled': [
    async (payload: EventPayload<'auth.2fa-disabled'>) => {
      logger.warn('2FA disabled', {
        userId: payload.userId,
        method: payload.method,
        disabledBy: payload.disabledBy,
      })

      await emit('email.send', {
        to: payload.email,
        template: '2fa-disabled',
        subject: 'Two-factor authentication disabled on your Emberly account',
        variables: {
          email: payload.email,
          method: payload.method,
          disabledBy: payload.disabledBy,
          disabledAt: new Date().toISOString(),
          ip: payload.context?.ip || 'Unknown',
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'auth.2fa-disabled',
      })
    },
  ],

  'auth.2fa-backup-codes-generated': [
    async (payload: EventPayload<'auth.2fa-backup-codes-generated'>) => {
      logger.info('Backup codes generated', {
        userId: payload.userId,
        codesCount: payload.codesCount,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'backup-codes-generated',
        subject: 'New backup codes generated for your Emberly account',
        variables: {
          email: payload.email,
          codesCount: payload.codesCount,
          generatedAt: new Date().toISOString(),
        },
        userId: payload.userId,
        priority: 'normal',
        sourceEvent: 'auth.2fa-backup-codes-generated',
      })
    },
  ],

  'auth.2fa-backup-code-used': [
    async (payload: EventPayload<'auth.2fa-backup-code-used'>) => {
      logger.warn('Backup code used', {
        userId: payload.userId,
        codesRemaining: payload.codesRemaining,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'backup-code-used',
        subject: 'A backup code was used to sign in to your Emberly account',
        variables: {
          email: payload.email,
          codesRemaining: payload.codesRemaining,
          usedAt: new Date().toISOString(),
          ip: payload.context?.ip || 'Unknown',
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'auth.2fa-backup-code-used',
      })
    },
  ],

  'auth.session-revoked': [
    async (payload: EventPayload<'auth.session-revoked'>) => {
      logger.info('Session revoked', {
        userId: payload.userId,
        sessionId: payload.sessionId,
        revokedBy: payload.revokedBy,
      })

      if (payload.revokedBy !== 'user') {
        await emit('email.send', {
          to: payload.email,
          template: 'session-revoked',
          subject: 'A session was revoked on your Emberly account',
          variables: {
            email: payload.email,
            revokedBy: payload.revokedBy,
            reason: payload.reason || 'Security precaution',
            revokedAt: new Date().toISOString(),
          },
          userId: payload.userId,
          priority: 'high',
          sourceEvent: 'auth.session-revoked',
        })
      }
    },
  ],
}
