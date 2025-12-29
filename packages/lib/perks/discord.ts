/**
 * Discord booster checking and perk verification
 */

import { loggers } from '@/packages/lib/logger'
import { addPerkRole, removePerkRole } from './index'
import { PERK_ROLES } from './constants'
import { events } from '@/packages/lib/events'
import { prisma } from '@/packages/lib/database/prisma'

const logger = loggers.api

const DISCORD_SERVER_ID = '871204257649557604'
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ''
const DISCORD_API_VERSION = '10'
const DISCORD_API_BASE = `https://discord.com/api/v${DISCORD_API_VERSION}`

/**
 * Make a Discord API request
 */
async function discordApiCall<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${DISCORD_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Discord API error: ${response.status} ${error}`)
  }

  return response.json() as Promise<T>
}

/**
 * Verify if a Discord user is a booster in the specified server
 */
export async function isDiscordBooster(discordUserId: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN) {
    logger.warn('Discord bot token not configured')
    return false
  }

  try {
    // Get guild member
    const member = await discordApiCall<any>(
      `/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}`
    )

    // Check if user has the booster role (premium subscriber)
    // Discord adds premium_since timestamp when user boosts the server
    if (member.premium_since) {
      return true
    }

    return false
  } catch (error) {
    const errorMessage = (error as Error).message
    if (errorMessage.includes('404')) {
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
 * This is a one-time perk - once earned, it cannot be lost even if boost expires
 */
export async function verifyDiscordBoosterStatus(
  userId: string,
  discordUserId: string
): Promise<boolean> {
  try {
    // Import here to avoid circular dependency
    const { hasEarnedOneTimePerk } = await import('./index')
    
    // Check if user already earned booster perk once
    const alreadyEarned = await hasEarnedOneTimePerk(userId, 'DISCORD_BOOSTER')
    
    const isBooster = await isDiscordBooster(discordUserId)

    if (isBooster) {
      if (!alreadyEarned) {
        // First time - award the perk
        await addPerkRole(userId, PERK_ROLES.DISCORD_BOOSTER)
        logger.info('Discord booster perk awarded to user', { userId, discordUserId })
        
        // Get user email for event emission
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        })
        
        if (user?.email) {
          // Emit perk-gained event
          await events.emit('user.perk-gained', {
            userId,
            email: user.email,
            perkName: 'Discord Booster',
            perkDescription: 'Unlock exclusive perks for boosting the Emberly Discord server',
            perkIcon: '🎉',
            expiresAt: null, // Discord booster perk doesn't expire
            viewUrl: '/profile?tab=security#linked-accounts',
          })
        }
      }
      return true
    } else {
      // User is not currently a booster
      if (alreadyEarned) {
        // Already earned once - perk is permanent, don't remove
        logger.debug('User no longer booster but perk retained as one-time award', { userId, discordUserId })
        return false // Return false because they're not currently boosting
      }
      // Never earned it
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
    const user = await discordApiCall<any>(`/users/${discordUserId}`)

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
    const guild = await discordApiCall<any>(`/guilds/${DISCORD_SERVER_ID}`)

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
