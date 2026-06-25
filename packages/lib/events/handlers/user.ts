import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'
import { emit } from '../bullmq/queue'
import type { HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('user-handler')

export const userHandlers: HandlerMap = {
  'user.perk-gained': [
    async (payload: EventPayload<'user.perk-gained'>) => {
      logger.info('Perk gained', {
        userId: payload.userId,
        perkName: payload.perkName,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'perk-gained',
        subject: `You've unlocked: ${payload.perkName}`,
        variables: {
          userName: undefined,
          perkName: payload.perkName,
          perkDescription: payload.perkDescription,
          perkIcon: payload.perkIcon || '🎉',
          expiresAt: payload.expiresAt?.toISOString(),
        },
        userId: payload.userId,
        priority: 'normal',
        sourceEvent: 'user.perk-gained',
      })
    },
  ],

  'user.quota-reached': [
    async (payload: EventPayload<'user.quota-reached'>) => {
      logger.warn('Quota reached', {
        userId: payload.userId,
        quotaType: payload.quotaType,
        percentage: payload.percentage,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'quota-reached',
        subject: `You've reached your ${payload.quotaType} quota`,
        variables: {
          userName: undefined,
          quotaType: payload.quotaType,
          currentUsage: payload.currentUsage,
          quotaLimit: payload.quotaLimit,
          unit: payload.unit || 'GB',
          percentage: payload.percentage,
        },
        userId: payload.userId,
        priority: 'high',
        sourceEvent: 'user.quota-reached',
      })
    },
  ],

  'user.storage-assigned': [
    async (payload: EventPayload<'user.storage-assigned'>) => {
      logger.info('Storage assigned', {
        userId: payload.userId,
        storageAmount: payload.storageAmount,
      })

      await emit('email.send', {
        to: payload.email,
        template: 'storage-assigned',
        subject: `You've been assigned ${payload.storageAmount} ${payload.unit || 'GB'} of storage`,
        variables: {
          userName: undefined,
          storageAmount: payload.storageAmount,
          unit: payload.unit || 'GB',
          totalStorage: payload.totalStorage,
          reason: payload.reason,
          expiresAt: payload.expiresAt?.toISOString(),
        },
        userId: payload.userId,
        priority: 'normal',
        sourceEvent: 'user.storage-assigned',
      })
    },
  ],
}
