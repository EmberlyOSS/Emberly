import type { EventPayload } from '@/packages/types/events'

import { loggers } from '@/packages/lib/logger'
import { emit } from '../bullmq/queue'
import type { HandlerMap } from '../bullmq/types'

const logger = loggers.events.getChildLogger('nexium-handler')

export const nexiumHandlers: HandlerMap = {
  'nexium.profile-created': [
    async (payload: EventPayload<'nexium.profile-created'>) => {
      logger.info('Discovery profile created', {
        userId: payload.userId,
        profileId: payload.profileId,
      })
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'
      await emit('email.send', {
        to: payload.email,
        subject: 'Welcome to Nexium',
        template: 'nexium-welcome',
        variables: {
          profileUrl: `${baseUrl}/nexium`,
          profileId: payload.profileId,
        },
        userId: payload.userId,
        sourceEvent: 'nexium.profile-created',
      })
    },
  ],

  'nexium.profile-updated': [
    async (payload: EventPayload<'nexium.profile-updated'>) => {
      logger.debug('Discovery profile updated', {
        userId: payload.userId,
        fields: payload.fields,
      })
    },
  ],

  'nexium.profile-deleted': [
    async (payload: EventPayload<'nexium.profile-deleted'>) => {
      logger.debug('Nexium profile deleted', { userId: payload.userId })
    },
  ],

  'nexium.skill-added': [
    async (payload: EventPayload<'nexium.skill-added'>) => {
      logger.debug('Nexium skill added', {
        userId: payload.userId,
        skillName: payload.skillName,
      })
    },
  ],

  'nexium.skills-replaced': [
    async (payload: EventPayload<'nexium.skills-replaced'>) => {
      logger.debug('Nexium skills replaced', {
        userId: payload.userId,
        count: payload.count,
      })
    },
  ],

  'nexium.signal-added': [
    async (payload: EventPayload<'nexium.signal-added'>) => {
      logger.debug('Nexium signal added', {
        userId: payload.userId,
        signalType: payload.signalType,
        signalTitle: payload.signalTitle,
      })
    },
  ],

  'nexium.opportunity-created': [
    async (payload: EventPayload<'nexium.opportunity-created'>) => {
      logger.info('Nexium opportunity created', {
        userId: payload.userId,
        opportunityId: payload.opportunityId,
        title: payload.title,
      })
    },
  ],

  'nexium.opportunity-match': [
    async (payload: EventPayload<'nexium.opportunity-match'>) => {
      logger.info('Nexium opportunity match', {
        userId: payload.userId,
        opportunityId: payload.opportunityId,
      })
      await emit('email.send', {
        to: payload.email,
        subject: `New opportunity matched your Nexium profile: ${payload.opportunityTitle}`,
        template: 'nexium-opportunity',
        variables: {
          name: payload.name,
          opportunityTitle: payload.opportunityTitle,
          opportunityUrl: payload.opportunityUrl,
          companyName: payload.companyName,
          skills: payload.matchedSkills,
        },
        userId: payload.userId,
        sourceEvent: 'nexium.opportunity-match',
      })
    },
  ],

  'nexium.application-received': [
    async (payload: EventPayload<'nexium.application-received'>) => {
      logger.info('Nexium application received', {
        userId: payload.userId,
        applicationId: payload.applicationId,
        opportunityTitle: payload.opportunityTitle,
      })
      await emit('email.send', {
        to: payload.email,
        subject: `New application for "${payload.opportunityTitle}"`,
        template: 'basic',
        variables: {
          headline: 'New Application Received',
          body: [
            `${payload.applicantName} has applied for your opportunity: ${payload.opportunityTitle}.`,
            "Review their profile and application message to decide if they're a good fit.",
          ],
          ctaLabel: 'Review Application',
          ctaHref: payload.reviewUrl,
        },
        userId: payload.userId,
        sourceEvent: 'nexium.application-received',
      })
    },
  ],

  'nexium.application-accepted': [
    async (payload: EventPayload<'nexium.application-accepted'>) => {
      logger.info('Nexium application accepted', {
        userId: payload.userId,
        applicationId: payload.applicationId,
        opportunityTitle: payload.opportunityTitle,
      })
      const greeting = payload.name ? `Hi ${payload.name}!` : 'Hi there!'
      const detail = payload.squadName
        ? `Your application for "${payload.opportunityTitle}" (${payload.squadName}) has been accepted.`
        : `Your application for "${payload.opportunityTitle}" has been accepted.`
      await emit('email.send', {
        to: payload.email,
        subject: `Your application for "${payload.opportunityTitle}" was accepted`,
        template: 'basic',
        variables: {
          headline: 'Application Accepted',
          body: [
            greeting,
            `Congratulations! ${detail}`,
            'Head to your Nexium profile to connect and get started.',
          ],
          ctaLabel: 'View Your Profile',
          ctaHref: payload.profileUrl,
        },
        userId: payload.userId,
        sourceEvent: 'nexium.application-accepted',
      })
    },
  ],

  'nexium.application-rejected': [
    async (payload: EventPayload<'nexium.application-rejected'>) => {
      logger.info('Nexium application rejected', {
        userId: payload.userId,
        applicationId: payload.applicationId,
        opportunityTitle: payload.opportunityTitle,
      })
      const greeting = payload.name ? `Hi ${payload.name}!` : 'Hi there!'
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'
      await emit('email.send', {
        to: payload.email,
        subject: `Update on your application for "${payload.opportunityTitle}"`,
        template: 'basic',
        variables: {
          headline: 'Application Update',
          body: [
            greeting,
            `Thank you for applying for "${payload.opportunityTitle}". After careful consideration, the team has decided to move forward with other candidates.`,
            "Don't be discouraged – keep building your profile and exploring other opportunities on Nexium.",
          ],
          ctaLabel: 'Browse Opportunities',
          ctaHref: `${baseUrl}/nexium`,
        },
        userId: payload.userId,
        sourceEvent: 'nexium.application-rejected',
      })
    },
  ],

  'nexium.squad-created': [
    async (payload: EventPayload<'nexium.squad-created'>) => {
      logger.info('Nexium squad created', {
        userId: payload.userId,
        squadId: payload.squadId,
        squadName: payload.squadName,
      })
    },
  ],

  'nexium.squad-invite': [
    async (payload: EventPayload<'nexium.squad-invite'>) => {
      logger.info('Nexium squad invite sent', {
        userId: payload.userId,
        squadId: payload.squadId,
        squadName: payload.squadName,
      })
      await emit('email.send', {
        to: payload.email,
        subject: `You've been invited to join ${payload.squadName} on Nexium`,
        template: 'nexium-squad-invite',
        variables: {
          name: payload.name,
          squadName: payload.squadName,
          inviterName: payload.inviterName,
          inviteUrl: payload.inviteUrl,
          declineUrl: payload.declineUrl,
        },
        userId: payload.userId,
        sourceEvent: 'nexium.squad-invite',
      })
    },
  ],

  'nexium.squad-invite-accepted': [
    async (payload: EventPayload<'nexium.squad-invite-accepted'>) => {
      logger.info('Nexium squad invite accepted', {
        ownerId: payload.ownerId,
        squadId: payload.squadId,
        memberName: payload.memberName,
      })
      await emit('email.send', {
        to: payload.ownerEmail,
        subject: `${payload.memberName} accepted your invite to ${payload.squadName}`,
        template: 'nexium-squad-invite-accepted',
        variables: {
          ownerName: payload.ownerName,
          memberName: payload.memberName,
          squadName: payload.squadName,
          squadUrl: payload.squadUrl,
        },
        userId: payload.ownerId,
        sourceEvent: 'nexium.squad-invite-accepted',
      })
    },
  ],

  'nexium.squad-invite-declined': [
    async (payload: EventPayload<'nexium.squad-invite-declined'>) => {
      logger.info('Nexium squad invite declined', {
        ownerId: payload.ownerId,
        squadId: payload.squadId,
        memberName: payload.memberName,
      })
      await emit('email.send', {
        to: payload.ownerEmail,
        subject: `${payload.memberName} declined your invite to ${payload.squadName}`,
        template: 'nexium-squad-invite-declined',
        variables: {
          ownerName: payload.ownerName,
          memberName: payload.memberName,
          squadName: payload.squadName,
        },
        userId: payload.ownerId,
        sourceEvent: 'nexium.squad-invite-declined',
      })
    },
  ],
}
