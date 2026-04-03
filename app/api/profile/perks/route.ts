

import { prisma } from '@/packages/lib/database/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { calculateStorageBonusGB, calculateDomainSlotBonus, getContributorMilestone, getNextContributorMilestone, getDiscordBoosterMilestone, getNextDiscordBoosterMilestone } from '@/packages/lib/perks'
import { GITHUB_CONTRIBUTION_THRESHOLD, CONTRIBUTOR_MILESTONES, DISCORD_BOOSTER_MILESTONES } from '@/packages/lib/perks/constants'

interface PerkInfo {
  name: string
  icon: string
  description: string
  benefits: string[]
  active: boolean
  earnedAt?: string
  level?: number
  progress?: {
    current: number
    next: number
    unit: string
  }
}

/**
 * GET /api/profile/perks
 * Get all perks (active and available) for the authenticated user
 */
export async function GET(req: Request) {
  try {
    const { user: authUser, response } = await requireAuth(req)
    if (response) return response

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        perkRoles: true,
        linkedAccounts: {
          select: {
            provider: true,
            linkedAt: true,
            providerUsername: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const perks: PerkInfo[] = []
    const perkRoles = user.perkRoles || []

    // Calculate bonuses
    const storageBonus = calculateStorageBonusGB(perkRoles)
    const domainBonus = calculateDomainSlotBonus(perkRoles)

    // GitHub Contributor Perk
    const contributorPerk = perkRoles.find((role) => role.startsWith('CONTRIBUTOR:'))
    let currentLOC = contributorPerk
      ? parseInt(contributorPerk.split(':')[1] || '0')
      : 0
    
    // Legacy compatibility: old format was CONTRIBUTOR:{levels} where levels = LOC/1000
    if (currentLOC > 0 && currentLOC < 100) {
      currentLOC = currentLOC * 1000 // Convert old level format to LOC
    }
    
    const hasContributor = currentLOC >= GITHUB_CONTRIBUTION_THRESHOLD
    const githubAccount = user.linkedAccounts.find((acc) => acc.provider === 'github')
    const currentMilestone = getContributorMilestone(currentLOC)
    const nextMilestone = getNextContributorMilestone(currentLOC)

    if (hasContributor && currentMilestone) {
      const storageDisplay = currentMilestone.storageGB >= 1 
        ? `${currentMilestone.storageGB}GB`
        : `${currentMilestone.storageGB * 1000}MB`

      perks.push({
        name: `GitHub Contributor - ${currentMilestone.tier}`,
        icon: currentMilestone.icon,
        description: 'Recognized contributor to the Emberly open source project',
        benefits: [
          `+${storageDisplay} bonus storage (${currentMilestone.tier} tier)`,
          `+${currentMilestone.domainSlots} custom domain slot${currentMilestone.domainSlots > 1 ? 's' : ''}`,
          'Priority support and bug reports',
          'Early access to new features',
          'Contributor badge on profile',
          'Community recognition',
        ],
        active: true,
        earnedAt: githubAccount?.linkedAt.toISOString(),
        level: CONTRIBUTOR_MILESTONES.findIndex(m => m.loc === currentMilestone.loc) + 1,
        progress: nextMilestone ? {
          current: currentLOC,
          next: nextMilestone.loc,
          unit: 'lines of code',
        } : undefined,
      })
    } else if (githubAccount) {
      // Linked but not yet contributor
      perks.push({
        name: 'GitHub Contributor',
        icon: '⭐',
        description: 'Contribute 1,000+ lines of code to unlock this perk',
        benefits: [
          'Bronze (1K LOC): +100MB, +1 domain',
          'Silver (5K LOC): +500MB, +2 domains',
          'Gold (10K LOC): +1GB, +3 domains',
          'Platinum (25K LOC): +2GB, +4 domains',
          'Diamond (50K LOC): +3GB, +5 domains',
          'Priority support and early access',
        ],
        active: false,
      })
    } else {
      // Not linked at all
      perks.push({
        name: 'GitHub Contributor',
        icon: '⭐',
        description: 'Link your GitHub account and contribute to unlock',
        benefits: [
          'Bronze (1K LOC): +100MB, +1 domain',
          'Silver (5K LOC): +500MB, +2 domains',
          'Gold (10K LOC): +1GB, +3 domains',
          'Platinum (25K LOC): +2GB, +4 domains',
          'Diamond (50K LOC): +3GB, +5 domains',
          'Priority support and early access',
        ],
        active: false,
      })
    }

    // Discord Booster Perk
    const boosterPerk = perkRoles.find((role) => role.startsWith('DISCORD_BOOSTER:'))
    const boostMonths = boosterPerk ? parseInt(boosterPerk.split(':')[1] || '0') : 0
    const hasBooster = !!boosterPerk // presence of the role means they are/were boosting
    const discordAccount = user.linkedAccounts.find((acc) => acc.provider === 'discord')
    const currentBoosterMilestone = getDiscordBoosterMilestone(boostMonths)
    const nextBoosterMilestone = getNextDiscordBoosterMilestone(boostMonths)

    if (hasBooster && !currentBoosterMilestone) {
      // Boosting but hasn't hit the 1-month Bronze milestone yet
      perks.push({
        name: 'Discord Booster - Pending',
        icon: '🚀',
        description: 'Thank you for boosting! Bronze unlocks after 1 month.',
        benefits: [
          'Bronze (1 month): +1GB, +1 domain',
          'Silver (3 months): +2GB, +1 domain',
          'Gold (6 months): +3GB, +2 domains',
          'Platinum (12 months): +5GB, +2 domains',
          'Diamond (24 months): +7GB, +3 domains',
        ],
        active: true,
        progress: nextBoosterMilestone ? {
          current: boostMonths,
          next: nextBoosterMilestone.months,
          unit: 'months boosting',
        } : undefined,
      })
    } else if (hasBooster && currentBoosterMilestone) {
      // Calculate time to next milestone
      let progressInfo = undefined
      if (nextBoosterMilestone && discordAccount) {
        const monthsSinceStart = Math.floor(
          (Date.now() - discordAccount.linkedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
        progressInfo = {
          current: monthsSinceStart,
          next: nextBoosterMilestone.months,
          unit: 'months boosting',
        }
      }

      perks.push({
        name: `Discord Booster - ${currentBoosterMilestone.tier}`,
        icon: currentBoosterMilestone.icon,
        description: 'Thank you for boosting the Emberly Discord server!',
        benefits: [
          `+${currentBoosterMilestone.storageGB}GB bonus storage (${currentBoosterMilestone.tier} tier)`,
          `+${currentBoosterMilestone.domainSlots} custom domain slot${currentBoosterMilestone.domainSlots > 1 ? 's' : ''}`,
          'Exclusive Discord role and perks',
          'Priority support in Discord',
          'Booster badge on profile',
        ],
        active: true,
        earnedAt: discordAccount?.linkedAt.toISOString(),
        level: DISCORD_BOOSTER_MILESTONES.findIndex(m => m.months === currentBoosterMilestone.months) + 1,
        progress: progressInfo,
      })
    } else if (discordAccount) {
      // Linked but not boosting
      perks.push({
        name: 'Discord Booster',
        icon: '🚀',
        description: 'Boost our Discord server to unlock this perk',
        benefits: [
          'Bronze (1 month): +1GB, +1 domain',
          'Silver (3 months): +2GB, +1 domain',
          'Gold (6 months): +3GB, +2 domains',
          'Platinum (12 months): +5GB, +2 domains',
          'Diamond (24 months): +7GB, +3 domains',
          'Exclusive Discord perks and priority support',
        ],
        active: false,
      })
    } else {
      // Not linked
      perks.push({
        name: 'Discord Booster',
        icon: '🚀',
        description: 'Link Discord and boost our server to unlock',
        benefits: [
          'Bronze (1 month): +1GB, +1 domain',
          'Silver (3 months): +2GB, +1 domain',
          'Gold (6 months): +3GB, +2 domains',
          'Platinum (12 months): +5GB, +2 domains',
          'Diamond (24 months): +7GB, +3 domains',
          'Exclusive Discord perks and priority support',
        ],
        active: false,
      })
    }

    // Affiliate Perk (future)
    const hasAffiliate = perkRoles.includes('AFFILIATE')
    if (hasAffiliate) {
      perks.push({
        name: 'Affiliate Partner',
        icon: '💼',
        description: 'Official Emberly affiliate partner',
        benefits: [
          'Earn commission on referrals',
          'Exclusive affiliate dashboard',
          'Custom referral codes',
          'Marketing materials and support',
          'Partner badge on profile',
        ],
        active: true,
      })
    }

    return NextResponse.json({
      perks,
      summary: {
        activePerks: perks.filter((p) => p.active).length,
        totalPerks: perks.length,
        bonuses: {
          storage: storageBonus > 0 ? `+${storageBonus}GB` : null,
          domains: domainBonus > 0 ? `+${domainBonus} slot${domainBonus > 1 ? 's' : ''}` : null,
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/profile/perks]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
