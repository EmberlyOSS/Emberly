/**
 * GitHub contribution checking and perk verification
 */

import { loggers } from '@/packages/lib/logger'
import { recalculateContributorLevel, addPerkRole, removePerkRole } from './index'
import { PERK_ROLES } from './constants'
import { events } from '@/packages/lib/events'
import { prisma } from '@/packages/lib/database/prisma'
import { getGitHubUser, getOrgRepos, getRepoCommits, getCommitDetail } from '@/packages/lib/github'

const logger = loggers.api

/**
 * Get total lines of code contributed by a GitHub user
 * across all repos in EmberlyOSS organization
 */
export async function getContributorLinesOfCode(
  githubUsername: string,
  personalAccessToken: string
): Promise<number> {
  try {
    // Get all repos in EmberlyOSS organization
    const repos = await getOrgRepos('EmberlyOSS')

    let totalLines = 0

    for (const repo of repos) {
      try {
        // Get all commits by the user in this repo
        const commits = await getRepoCommits('EmberlyOSS', repo.name, githubUsername, 100)

        for (const commit of commits) {
          try {
            // Get commit details to count line changes
            const commitDetail = await getCommitDetail('EmberlyOSS', repo.name, commit.sha)

            // Count additions (line additions are more valuable than just commits)
            totalLines += commitDetail?.stats?.additions || 0
          } catch (error) {
            logger.debug(`Failed to get commit details for ${commit.sha}`, error as Error)
            continue
          }
        }
      } catch (error) {
        // Repo might be private or other access issues, continue with next
        logger.debug(`Failed to get commits for ${repo.name}`, error as Error)
        continue
      }
    }

    return totalLines
  } catch (error) {
    logger.error('Failed to get GitHub contribution data', error as Error, {
      githubUsername,
    })
    throw error
  }
}

/**
 * Verify and update contributor status for a user
 * This is a one-time perk per user - they can level up but can't lose it once earned
 */
export async function verifyContributorStatus(
  userId: string,
  githubUsername: string,
  personalAccessToken: string
): Promise<boolean> {
  try {
    // Import here to avoid circular dependency
    const { hasEarnedOneTimePerk } = await import('./index')
    
    // Check if user already earned contributor perk once
    const alreadyEarned = await hasEarnedOneTimePerk(userId, 'CONTRIBUTOR')
    
    const linesOfCode = await getContributorLinesOfCode(githubUsername, personalAccessToken)

    if (linesOfCode >= 1000) {
      // User qualifies as contributor
      if (!alreadyEarned) {
        // First time earning - award the perk
        await recalculateContributorLevel(userId, linesOfCode)
        logger.info('Contributor perk awarded to user', { userId, linesOfCode })
        
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
            perkName: 'GitHub Contributor',
            perkDescription: 'Unlock exclusive perks for contributing to the Emberly open source project',
            perkIcon: '⭐',
            expiresAt: null, // Contributor perk doesn't expire
            viewUrl: '/profile?tab=security#linked-accounts',
          })
        }
      } else {
        // Already earned before - just update level if it increased
        await recalculateContributorLevel(userId, linesOfCode)
        logger.info('Contributor level updated for user', { userId, linesOfCode })
      }
      return true
    } else {
      // User doesn't meet contributor threshold
      if (!alreadyEarned) {
        // Never earned it, nothing to remove
        return false
      }
      // Already earned once, but levels dropped below threshold
      // Don't remove the perk - it's permanent once earned
      logger.warn('User contributor LOC dropped below threshold but perk retained', { userId, linesOfCode })
      return false
    }
  } catch (error) {
    logger.error('Failed to verify contributor status', error as Error, {
      userId,
      githubUsername,
    })
    return false
  }
}

/**
 * Check if a GitHub username exists
 */
export async function githubUserExists(
  githubUsername: string,
  personalAccessToken: string
): Promise<boolean> {
  const user = await getGitHubUser(githubUsername)
  return user !== null
}

/**
 * Get GitHub user info (for storing user data)
 * If no username provided, fetches authenticated user's info
 */
export async function getGitHubUserInfo(
  githubUsername: string,
  personalAccessToken: string
): Promise<{
  id: number
  login: string
  avatar_url?: string
  name?: string
} | null> {
  try {
    let user: { id: number; login: string; avatar_url: string; name: string | null } | null

    if (githubUsername) {
      user = await getGitHubUser(githubUsername)
    } else {
      // Use the user's OAuth access token to fetch the authenticated user
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${personalAccessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })
      if (!res.ok) {
        logger.error('Failed to get GitHub user info via token', new Error(`HTTP ${res.status}`), {})
        return null
      }
      user = await res.json()
    }

    if (!user) return null
    return {
      id: user.id,
      login: user.login,
      avatar_url: user.avatar_url,
      name: user.name ?? undefined,
    }
  } catch (error) {
    logger.error('Failed to get GitHub user info', error as Error, {
      githubUsername,
    })
    return null
  }
}
