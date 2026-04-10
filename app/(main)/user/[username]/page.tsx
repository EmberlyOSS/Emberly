import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Lock } from 'lucide-react'
import { PublicProfile } from '@/packages/components/profile/public-profile'
import { calculateStorageBonusGB, calculateDomainSlotBonus, getContributorMilestone, getDiscordBoosterMilestone } from '@/packages/lib/perks'
import { prisma } from '@/packages/lib/database/prisma'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { authOptions } from '@/packages/lib/auth'

interface PublicProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  try {
    const { username } = await params
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { urlId: username },
          { vanityId: username },
          { name: { equals: username, mode: 'insensitive' } },
        ],
        isProfilePublic: true,
      },
      select: {
        name: true,
        bio: true,
      },
    })

    if (!user) {
      return buildPageMetadata({
        title: 'Profile Not Found',
        description: 'The profile you are looking for could not be found.',
      })
    }

    return buildPageMetadata({
      title: `${user.name || 'User'} | Emberly`,
      description: user.bio || `View ${user.name || 'this user'}'s Emberly profile`,
    })
  } catch (error) {
    return buildPageMetadata({
      title: 'Profile Not Found',
      description: 'The profile you are looking for could not be found.',
    })
  }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params

  const [session] = await Promise.all([
    getServerSession(authOptions),
  ])

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { urlId: username },
        { vanityId: username },
        { name: { equals: username, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      fullName: true,
      image: true,
      banner: true,
      avatarDecoration: true,
      isVerified: true,
      bio: true,
      website: true,
      twitter: true,
      github: true,
      discord: true,
      createdAt: true,
      perkRoles: true,
      grants: true,
      urlId: true,
      vanityId: true,
      alphaUser: true,
      role: true,
      isProfilePublic: true,
      _count: {
        select: {
          files: {
            where: { visibility: 'PUBLIC' },
          },
        },
      },
      linkedAccounts: {
        select: {
          provider: true,
          providerUsername: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  // Private profile — show a locked placeholder rather than 404
  if (!user.isProfilePublic) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card max-w-sm w-full p-8 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mx-auto">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{user.name || 'This user'}</h1>
            <p className="text-sm text-muted-foreground mt-1">This profile is private.</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate perk benefits on server side
  const storageBonus = calculateStorageBonusGB(user.perkRoles)
  const domainBonus = calculateDomainSlotBonus(user.perkRoles)

  // Get perk milestone info for contributor
  const contributorPerk = user.perkRoles.find((role) => role.startsWith('CONTRIBUTOR:'))
  let contributorLOC = contributorPerk ? parseInt(contributorPerk.split(':')[1] || '0') : 0
  
  // Legacy compatibility
  if (contributorLOC > 0 && contributorLOC < 100) {
    contributorLOC = contributorLOC * 1000
  }
  
  const contributorMilestone = getContributorMilestone(contributorLOC)

  // Get Discord booster milestone info
  const boosterPerk = user.perkRoles.find((role) => role.startsWith('DISCORD_BOOSTER:'))
  const boostMonths = boosterPerk ? parseInt(boosterPerk.split(':')[1] || '0') : 0
  const boosterMilestone = getDiscordBoosterMilestone(boostMonths)

  // Get linked account usernames
  const linkedAccounts = {
    github: user.linkedAccounts.find((a) => a.provider === 'github')?.providerUsername || undefined,
    discord: user.linkedAccounts.find((a) => a.provider === 'discord')?.providerUsername || undefined,
  }

  // Calculate leaderboard rank if profile is public
  let leaderboardRank: number | null = null
  if (user.isProfilePublic) {
    try {
      const publicFileCount = user._count.files
      // Count users with more public files
      const rankResult = await prisma.$queryRaw`
        SELECT COUNT(*) as rank_higher
        FROM (
          SELECT u.id, COUNT(f.id) as file_count
          FROM "User" u
          LEFT JOIN "File" f ON u.id = f."userId" AND f.visibility = 'PUBLIC'
          WHERE u."isProfilePublic" = true
          GROUP BY u.id
        ) as user_counts
        WHERE file_count > ${publicFileCount}
      ` as any[]
      
      if (rankResult && rankResult[0]) {
        leaderboardRank = Number(rankResult[0].rank_higher) + 1
      }
    } catch (error) {
      console.error('Failed to calculate leaderboard rank:', error)
    }
  }

  // Fetch Nexium profile if the user has one
  const nexiumProfile = await prisma.nexiumProfile
    .findUnique({
      where: { userId: user.id },
      select: {
        title: true,
        headline: true,
        availability: true,
        lookingFor: true,
        location: true,
        timezone: true,
        activeHours: true,
        isVisible: true,
        user: {
          select: {
            name: true,
            fullName: true,
            urlId: true,
            vanityId: true,
          },
        },
        skills: {
          select: { id: true, name: true, level: true, category: true, yearsExperience: true },
          orderBy: { sortOrder: 'asc' },
        },
        signals: {
          select: { id: true, type: true, title: true, url: true, description: true, imageUrl: true, metadata: true, verified: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    .then((p) => (p?.isVisible ? p : null))
    .catch(() => null)

  return (
    <PublicProfile 
      user={user} 
      storageBonus={storageBonus} 
      domainBonus={domainBonus}
      linkedAccounts={linkedAccounts}
      leaderboardRank={leaderboardRank}
      currentUserId={session?.user?.id ?? null}
      contributorInfo={contributorMilestone ? {
        linesOfCode: contributorLOC,
        tier: contributorMilestone.tier,
        icon: contributorMilestone.icon,
        storageGB: contributorMilestone.storageGB,
        domainSlots: contributorMilestone.domainSlots,
      } : undefined}
      boosterInfo={boosterMilestone ? {
        months: boostMonths,
        tier: boosterMilestone.tier,
        icon: boosterMilestone.icon,
        storageGB: boosterMilestone.storageGB,
        domainSlots: boosterMilestone.domainSlots,
      } : undefined}
      nexiumProfile={nexiumProfile}
    />
  )
}
