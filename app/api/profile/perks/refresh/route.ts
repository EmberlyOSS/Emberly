import { prisma } from '@/packages/lib/database/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { verifyDiscordBoosterStatus } from '@/packages/lib/perks/discord'
import { verifyContributorStatus } from '@/packages/lib/perks/github'

/**
 * POST /api/profile/perks/refresh
 * Re-check and update perk eligibility for the authenticated user.
 * Verifies Discord boost status and GitHub contribution status in real time.
 */
export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const linkedAccounts = await prisma.linkedAccount.findMany({
      where: { userId: user.id },
      select: { provider: true, providerUserId: true, accessToken: true, providerUsername: true },
    })

    const results: Record<string, boolean | string> = {}

    // Re-check Discord booster status
    const discordAccount = linkedAccounts.find((a) => a.provider === 'discord')
    if (discordAccount) {
      try {
        results.discord = await verifyDiscordBoosterStatus(user.id, discordAccount.providerUserId)
      } catch {
        results.discord = 'error'
      }
    } else {
      results.discord = 'not_linked'
    }

    // Re-check GitHub contributor status
    const githubAccount = linkedAccounts.find((a) => a.provider === 'github')
    if (githubAccount && githubAccount.accessToken && githubAccount.providerUsername) {
      try {
        results.github = await verifyContributorStatus(
          user.id,
          githubAccount.providerUsername,
          githubAccount.accessToken
        )
      } catch {
        results.github = 'error'
      }
    } else if (githubAccount) {
      results.github = 'no_token'
    } else {
      results.github = 'not_linked'
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('[POST /api/profile/perks/refresh]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
