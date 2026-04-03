/**
 * Discord booster checking and perk verification
 */

import { loggers } from '@/packages/lib/logger'
import { addPerkRole, removePerkRole } from './index'
import { PERK_ROLES } from './constants'
import { events } from '@/packages/lib/events'
import { prisma } from '@/packages/lib/database/prisma'

const logger = loggers.api

const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID || 'DISCORD_SERVER_ID'
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ''
const DISCORD_SUPPORTER_ROLE_ID = process.env.DISCORD_SUPPORTER_ROLE || ''
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
 * Assign the Discord supporter role to a guild member.
 */
export async function assignDiscordSupporterRole(discordUserId: string): Promise<void> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_SUPPORTER_ROLE_ID) return
  try {
    const res = await fetch(
      `${DISCORD_API_BASE}/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}/roles/${DISCORD_SUPPORTER_ROLE_ID}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'X-Audit-Log-Reason': 'Emberly: active subscription or server boost',
        },
      }
    )
    if (!res.ok && res.status !== 204) {
      logger.warn('Failed to assign Discord supporter role', { discordUserId, status: res.status })
    }
  } catch (error) {
    logger.warn('Error assigning Discord supporter role', { discordUserId, error })
  }
}

/**
 * Remove the Discord supporter role from a guild member.
 */
export async function removeDiscordSupporterRole(discordUserId: string): Promise<void> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_SUPPORTER_ROLE_ID) return
  try {
    const res = await fetch(
      `${DISCORD_API_BASE}/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}/roles/${DISCORD_SUPPORTER_ROLE_ID}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'X-Audit-Log-Reason': 'Emberly: no active subscription or server boost',
        },
      }
    )
    // 204 = success, 404 = member not in server or role not assigned — both are acceptable
    if (!res.ok && res.status !== 204 && res.status !== 404) {
      logger.warn('Failed to remove Discord supporter role', { discordUserId, status: res.status })
    }
  } catch (error) {
    logger.warn('Error removing Discord supporter role', { discordUserId, error })
  }
}

/**
 * Sync the Discord supporter role for a user.
 * Assigns the role if they have an active booster perk OR an active subscription;
 * removes it if neither condition is true.
 */
export async function syncDiscordSupporterRole(userId: string, discordUserId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        perkRoles: true,
        subscriptions: { where: { status: 'active' }, take: 1 },
      },
    })
    if (!user) return

    const hasBoosterPerk = user.perkRoles.some((p) => p.startsWith('DISCORD_BOOSTER:'))
    const hasActiveSubscription = user.subscriptions.length > 0

    if (hasBoosterPerk || hasActiveSubscription) {
      await assignDiscordSupporterRole(discordUserId)
    } else {
      await removeDiscordSupporterRole(discordUserId)
    }
  } catch (error) {
    logger.warn('Failed to sync Discord supporter role', { userId, discordUserId, error })
  }
}

/**
 * Verify if a Discord user is a booster in the specified server.
 * Returns { isBooster, premiumSince, avatarDecorationUrl } so callers can use the actual boost start date
 * and store the user's avatar decoration.
 */
export async function isDiscordBooster(discordUserId: string): Promise<{
  isBooster: boolean
  premiumSince: Date | null
  avatarDecorationUrl: string | null
}> {
  if (!DISCORD_BOT_TOKEN) {
    logger.warn('Discord bot token not configured — cannot verify booster status')
    return { isBooster: false, premiumSince: null, avatarDecorationUrl: null }
  }

  try {
    // Get guild member
    const member = await discordApiCall<any>(
      `/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}`
    )

    // Extract avatar decoration if present
    let avatarDecorationUrl: string | null = null
    if (member.user?.avatar_decoration_data?.asset) {
      avatarDecorationUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${member.user.avatar_decoration_data.asset}.png?size=160`
    }

    // premium_since is the ISO timestamp of when the user started boosting
    if (member.premium_since) {
      return { isBooster: true, premiumSince: new Date(member.premium_since), avatarDecorationUrl }
    }

    return { isBooster: false, premiumSince: null, avatarDecorationUrl }
  } catch (error) {
    const errorMessage = (error as Error).message
    if (errorMessage.includes('404')) {
      // Member not found in guild
      logger.debug(`Discord user ${discordUserId} not in server`, error as Error)
      return { isBooster: false, premiumSince: null, avatarDecorationUrl: null }
    }
    logger.error('Failed to check Discord booster status', error as Error, {
      discordUserId,
    })
    return { isBooster: false, premiumSince: null, avatarDecorationUrl: null }
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
    const { hasEarnedOneTimePerk, removePerkRole } = await import('./index')
    
    const hadBoosterPerk = await hasEarnedOneTimePerk(userId, 'DISCORD_BOOSTER')
    
    const { isBooster, premiumSince, avatarDecorationUrl } = await isDiscordBooster(discordUserId)

    // Store avatar decoration regardless of booster status
    if (avatarDecorationUrl) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarDecoration: avatarDecorationUrl },
      })
    }

    if (isBooster && premiumSince) {
      // Use actual Discord premium_since date to calculate true boost duration.
      const monthsSinceBoosting = Math.floor(
        (Date.now() - premiumSince.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
      const months = monthsSinceBoosting

      // Store the duration in the perk role for milestone calculation
      await addPerkRole(userId, `DISCORD_BOOSTER:${months}`)
      logger.info('Discord booster perk updated', { userId, discordUserId, months, premiumSince })
      await syncDiscordSupporterRole(userId, discordUserId)

      if (!hadBoosterPerk) {
        // First time earning - send notification email
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        })

        if (user?.email) {
          await events.emit('user.perk-gained', {
            userId,
            email: user.email,
            perkName: 'Discord Booster',
            perkDescription: 'Unlock exclusive perks for boosting the Emberly Discord server',
            perkIcon: '🚀',
            expiresAt: null,
            viewUrl: '/profile?tab=security#linked-accounts',
          })
        }
      }
      return true
    } else {
      // User is not currently boosting — revoke perk if they had it
      if (hadBoosterPerk) {
        await removePerkRole(userId, 'DISCORD_BOOSTER')
        logger.info('Discord booster perk revoked — user stopped boosting', { userId, discordUserId })
      }
      await syncDiscordSupporterRole(userId, discordUserId)
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
