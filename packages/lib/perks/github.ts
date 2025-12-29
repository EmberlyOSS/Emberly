/**
 * GitHub contribution checking and perk verification
 */

import { Octokit } from '@octokit/rest'
import { loggers } from '@/packages/lib/logger'
import { recalculateContributorLevel, addPerkRole, removePerkRole } from './index'
import { PERK_ROLES } from './constants'

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
    const octokit = new Octokit({ auth: personalAccessToken })

    // Get all repos in EmberlyOSS organization
    const repos = await octokit.repos.listForOrg({
      org: 'EmberlyOSS',
      per_page: 100,
      type: 'all',
    })

    let totalLines = 0

    for (const repo of repos.data) {
      try {
        // Get all commits by the user in this repo
        const commits = await octokit.repos.listCommits({
          owner: 'EmberlyOSS',
          repo: repo.name,
          author: githubUsername,
          per_page: 100,
        })

        for (const commit of commits.data) {
          // Get commit details to count line changes
          const commitDetail = await octokit.repos.getCommit({
            owner: 'EmberlyOSS',
            repo: repo.name,
            ref: commit.sha,
          })

          // Count additions (line additions are more valuable than just commits)
          totalLines += commitDetail.data.stats?.additions || 0
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
 */
export async function verifyContributorStatus(
  userId: string,
  githubUsername: string,
  personalAccessToken: string
): Promise<boolean> {
  try {
    const linesOfCode = await getContributorLinesOfCode(githubUsername, personalAccessToken)

    if (linesOfCode >= 1000) {
      // User is a contributor
      await recalculateContributorLevel(userId, linesOfCode)
      return true
    } else {
      // User doesn't meet contributor threshold
      await removePerkRole(userId, PERK_ROLES.CONTRIBUTOR)
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
  try {
    const octokit = new Octokit({ auth: personalAccessToken })
    await octokit.users.getByUsername({ username: githubUsername })
    return true
  } catch (error) {
    if ((error as any).status === 404) {
      return false
    }
    throw error
  }
}

/**
 * Get GitHub user info (for storing user data)
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
    const octokit = new Octokit({ auth: personalAccessToken })
    const user = await octokit.users.getByUsername({ username: githubUsername })
    return {
      id: user.data.id,
      login: user.data.login,
      avatar_url: user.data.avatar_url,
      name: user.data.name,
    }
  } catch (error) {
    logger.error('Failed to get GitHub user info', error as Error, {
      githubUsername,
    })
    return null
  }
}
