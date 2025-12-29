/**
 * Discord booster checking and perk verification
 */

import { Client, GatewayIntentBits, REST, Routes } from 'discord.js'
import { loggers } from '@/packages/lib/logger'
import { addPerkRole, removePerkRole } from './index'
import { PERK_ROLES } from './constants'

const logger = loggers.api

const DISCORD_SERVER_ID = '871204257649557604'
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ''

/**
 * Verify if a Discord user is a booster in the specified server
 */
export async function isDiscordBooster(discordUserId: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN) {
    logger.warn('Discord bot token not configured')
    return false
  }

  try {
    const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN)

    // Get guild member
    const member = (await rest.get(Routes.guildMember(DISCORD_SERVER_ID, discordUserId))) as any

    // Check if user has the booster role (premium subscriber)
    // Discord adds a special "Boosters" role to those who boost the server
    if (member.premium_since) {
      return true
    }

    return false
  } catch (error) {
    if ((error as any).code === 10007) {
      // Member not found in guild
      logger.debug(`Discord user ${discordUserId} not in server`, error as Error)
      return false
    }
    logger.error('Failed to check Discord booster status', error as Error, {
      discordUserId,
    })
    return false
  }
}

/**
 * Verify and update Discord booster status for a user
 */
export async function verifyDiscordBoosterStatus(
  userId: string,
  discordUserId: string
): Promise<boolean> {
  try {
    const isBooster = await isDiscordBooster(discordUserId)

    if (isBooster) {
      await addPerkRole(userId, PERK_ROLES.DISCORD_BOOSTER)
      return true
    } else {
      await removePerkRole(userId, PERK_ROLES.DISCORD_BOOSTER)
      return false
    }
  } catch (error) {
    logger.error('Failed to verify Discord booster status', error as Error, {
      userId,
      discordUserId,
    })
    return false
  }
}

/**
 * Get Discord user info from user ID
 * Note: This requires the user to be in the server or requires OAuth
 */
export async function getDiscordUserInfo(discordUserId: string): Promise<{
  id: string
  username: string
  avatar?: string
} | null> {
  if (!DISCORD_BOT_TOKEN) {
    return null
  }

  try {
    const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN)
    const user = (await rest.get(Routes.user(discordUserId))) as any

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    }
  } catch (error) {
    logger.debug('Failed to get Discord user info', error as Error, {
      discordUserId,
    })
    return null
  }
}

/**
 * Validate Discord bot token and connection
 */
export async function validateDiscordBot(): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN) {
    logger.warn('Discord bot token not configured')
    return false
  }

  try {
    const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN)
    const guild = (await rest.get(Routes.guild(DISCORD_SERVER_ID))) as any

    if (guild) {
      logger.info('Discord bot connection validated', {
        guildId: guild.id,
        guildName: guild.name,
      })
      return true
    }
    return false
  } catch (error) {
    logger.error('Failed to validate Discord bot connection', error as Error)
    return false
  }
}
