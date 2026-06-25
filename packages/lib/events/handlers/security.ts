import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'
import { notifyDiscord } from '../utils/discord-webhook'
import { getIntegrations } from '@/packages/lib/config'
import { emit } from '../bullmq/queue'
import type { HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('security-handler')

export const securityHandlers: HandlerMap = {
  'security.suspicious-activity': [
    async (payload: EventPayload<'security.suspicious-activity'>) => {
      logger.warn('Suspicious activity detected', {
        userId: payload.userId,
        activityType: payload.activityType,
        severity: payload.severity,
      })

      if (
        payload.email &&
        ['medium', 'high', 'critical'].includes(payload.severity)
      ) {
        await emit('email.send', {
          to: payload.email,
          template: 'suspicious-activity',
          subject: 'Suspicious activity detected on your Emberly account',
          variables: {
            email: payload.email,
            activityType: payload.activityType,
            details: payload.details,
            severity: payload.severity,
            ip: payload.context?.ip || 'Unknown',
            location: payload.context?.geo?.city
              ? `${payload.context.geo.city}, ${payload.context.geo.country}`
              : 'Unknown location',
            detectedAt: new Date().toISOString(),
          },
          userId: payload.userId,
          priority: 'high',
          sourceEvent: 'security.suspicious-activity',
        })
      }

      if (payload.severity === 'critical') {
        logger.error('CRITICAL security event', {
          userId: payload.userId,
          activityType: payload.activityType,
          details: payload.details,
          context: payload.context,
        })

        const integrations = await getIntegrations()
        const adminWebhookUrl =
          integrations.discord?.webhookUrl || process.env.DISCORD_WEBHOOK_URL
        if (adminWebhookUrl) {
          await notifyDiscord({
            webhookUrl: adminWebhookUrl,
            embeds: [
              {
                title: 'CRITICAL Security Event',
                description: payload.details,
                color: 0xef4444,
                fields: [
                  {
                    name: 'Activity',
                    value: payload.activityType,
                    inline: true,
                  },
                  {
                    name: 'Severity',
                    value: payload.severity.toUpperCase(),
                    inline: true,
                  },
                  {
                    name: 'User',
                    value: payload.email || payload.userId || 'Unknown',
                    inline: true,
                  },
                  {
                    name: 'IP',
                    value: payload.context?.ip || 'Unknown',
                    inline: true,
                  },
                ],
              },
            ],
          })
        }
      }
    },
  ],

  'security.rate-limit-exceeded': [
    async (payload: EventPayload<'security.rate-limit-exceeded'>) => {
      logger.warn('Rate limit exceeded', {
        userId: payload.userId,
        endpoint: payload.endpoint,
        limit: payload.limit,
        window: payload.window,
        ip: payload.context?.ip,
      })
    },
  ],

  'security.api-key-created': [
    async (payload: EventPayload<'security.api-key-created'>) => {
      logger.info('API key created', {
        userId: payload.userId,
        keyId: payload.keyId,
        keyName: payload.keyName,
        scopes: payload.scopes,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'api-key-created',
        subject: 'New API key created for your Emberly account',
        variables: {
          email: payload.email,
          keyName: payload.keyName,
          scopes: payload.scopes.join(', '),
          expiresAt: payload.expiresAt?.toISOString() || 'Never',
          createdAt: new Date().toISOString(),
          ip: payload.context?.ip || 'Unknown',
        },
        userId: payload.userId,
        priority: 'normal',
        sourceEvent: 'security.api-key-created',
      })
    },
  ],

  'security.api-key-revoked': [
    async (payload: EventPayload<'security.api-key-revoked'>) => {
      logger.info('API key revoked', {
        userId: payload.userId,
        keyId: payload.keyId,
        revokedBy: payload.revokedBy,
      })

      if (payload.revokedBy !== 'user') {
        await emit('email.send', {
          to: payload.email,
          template: 'api-key-revoked',
          subject: 'An API key was revoked on your Emberly account',
          variables: {
            email: payload.email,
            keyName: payload.keyName,
            revokedBy: payload.revokedBy,
            reason: payload.reason || 'Security precaution',
            revokedAt: new Date().toISOString(),
          },
          userId: payload.userId,
          priority: 'high',
          sourceEvent: 'security.api-key-revoked',
        })
      }
    },
  ],
}
