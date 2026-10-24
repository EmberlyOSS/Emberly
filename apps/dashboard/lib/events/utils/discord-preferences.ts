import type { EmailPreferences } from '@/types/dto/profile'

import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'

import { isDiscordWebhookUrl } from './discord-webhook'

const logger = loggers.events.getChildLogger('discord-preferences')

export const DEFAULT_DISCORD_PREFERENCES: EmailPreferences = {
  security: true,
  account: false,
  billing: true,
  marketing: false,
  productUpdates: false,
}

/** The user's webhook, if they want Discord notifications for this category. */
export async function getDiscordWebhook(
  userId: string,
  category: keyof EmailPreferences
): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        discordWebhookUrl: true,
        discordNotificationsEnabled: true,
        discordPreferences: true,
      },
    })
    if (!user?.discordNotificationsEnabled || !user.discordWebhookUrl)
      return null
    if (!isDiscordWebhookUrl(user.discordWebhookUrl)) return null

    const preferences = {
      ...DEFAULT_DISCORD_PREFERENCES,
      ...((user.discordPreferences as Partial<EmailPreferences>) ?? {}),
    }
    return preferences[category] ? user.discordWebhookUrl : null
  } catch (error) {
    logger.error('Error checking Discord preferences', error as Error, {
      userId,
      category,
    })
    return null
  }
}
