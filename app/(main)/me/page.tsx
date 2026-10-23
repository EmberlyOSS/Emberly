import dynamic from 'next/dynamic'
const ProfileClient = dynamic(() =>
  import('@/packages/components/profile').then((m) => m.ProfileClient)
)

import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { ArrowUpRight, User as UserIcon } from 'lucide-react'
import { redirect } from 'next/navigation'

import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { getConfig } from '@/packages/lib/config'
import { isCloudEnabled } from '@/packages/lib/config/env'
import { prisma } from '@/packages/lib/database/prisma'
import { formatFileSize } from '@/packages/lib/utils'
import { Button } from '@/packages/components/ui/button'

export const metadata = buildPageMetadata({
  title: 'Profile Settings',
  description:
    'Manage your account profile, preferences, and personal information.',
})

import { LogoutButton } from './logout-button'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      name: true,
      fullName: true,
      email: true,
      image: true,
      storageUsed: true,
      storageQuotaMB: true,
      role: true,
      randomizeFileUrls: true,
      enableRichEmbeds: true,
      emailNotificationsEnabled: true,
      emailPreferences: true,
      discordWebhookUrl: true,
      discordNotificationsEnabled: true,
      discordPreferences: true,
      defaultFileExpiration: true,
      defaultFileExpirationAction: true,
      urlId: true,
      vanityId: true,
      bio: true,
      website: true,
      twitter: true,
      github: true,
      discord: true,
      isProfilePublic: true,
      showLinkedAccounts: true,
      stripeCustomerId: true,
      passwordBreachDetectedAt: true,
      subscriptions: {
        select: {
          id: true,
          productId: true,
          status: true,
          currentPeriodEnd: true,
          product: { select: { name: true } },
        },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { files: true, shortenedUrls: true },
      },
    },
  })

  if (!user) {
    return redirect('/auth/login')
  }

  // If no subscription in DB but user has a Stripe customer, try a one-time sync.
  // This auto-heals missed webhooks without requiring manual intervention.
  let subscriptions: any[] = user.subscriptions
  if (subscriptions.length === 0 && user.stripeCustomerId) {
    try {
      const { syncUserSubscriptionsFromStripe } =
        await import('@/packages/lib/stripe/billing')
      await syncUserSubscriptionsFromStripe(user.id, user.stripeCustomerId)
      subscriptions = await prisma.subscription.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          productId: true,
          status: true,
          currentPeriodEnd: true,
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      })
    } catch (e) {
      console.warn('[ProfilePage] Stripe subscription sync failed:', e)
    }
  }

  const config = await getConfig()
  const quotasEnabled = config.settings.general.storage.quotas.enabled
  const defaultQuota = config.settings.general.storage.quotas.default

  // Use new quota system that includes purchased storage
  let quotaMB: number
  let purchasedMB: number = 0
  if (quotasEnabled) {
    const { getEffectiveQuotaMB } = await import('@/packages/lib/storage/quota')
    const defaultQuotaMB =
      defaultQuota.unit === 'GB'
        ? defaultQuota.value * 1024
        : defaultQuota.value
    const quotaInfo = await getEffectiveQuotaMB(user.id, defaultQuotaMB)
    quotaMB = quotaInfo.quotaMB
    purchasedMB = quotaInfo.purchasedMB
  } else {
    quotaMB = 0
  }

  const formattedQuota = formatFileSize(quotaMB)
  const formattedUsed = formatFileSize(user.storageUsed)
  const usagePercentage = quotasEnabled ? (user.storageUsed / quotaMB) * 100 : 0

  return (
    <div>
      <ProfileClient
        user={{
          id: user.id,
          name: user.name,
          fullName: user.fullName,
          email: user.email,
          image: user.image,
          storageUsed: user.storageUsed,
          role: user.role,
          randomizeFileUrls: user.randomizeFileUrls,
          enableRichEmbeds: user.enableRichEmbeds ?? true,
          emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
          emailPreferences: (user.emailPreferences as any) ?? undefined,
          discordWebhookUrl: user.discordWebhookUrl ?? null,
          discordNotificationsEnabled:
            user.discordNotificationsEnabled ?? false,
          discordPreferences: (user.discordPreferences as any) ?? undefined,
          urlId: user.urlId,
          vanityId: user.vanityId,
          bio: user.bio,
          website: user.website,
          twitter: user.twitter,
          github: user.github,
          discord: user.discord,
          isProfilePublic: user.isProfilePublic,
          showLinkedAccounts: user.showLinkedAccounts,
          stripeCustomerId: user.stripeCustomerId ?? null,
          subscription: subscriptions?.[0]
            ? {
                id: subscriptions[0].id,
                productId: subscriptions[0].productId,
                productName: (subscriptions[0] as any).product?.name ?? null,
                status: subscriptions[0].status,
                currentPeriodEnd: subscriptions[0].currentPeriodEnd
                  ? subscriptions[0].currentPeriodEnd.toISOString()
                  : null,
              }
            : null,
          fileCount: user._count.files,
          shortUrlCount: user._count.shortenedUrls,
          defaultFileExpiration: user.defaultFileExpiration,
          defaultFileExpirationAction: user.defaultFileExpirationAction,
          passwordBreachDetectedAt:
            user.passwordBreachDetectedAt?.toISOString() || null,
        }}
        quotasEnabled={quotasEnabled}
        formattedQuota={formattedQuota}
        formattedUsed={formattedUsed}
        usagePercentage={usagePercentage}
        isAdmin={user.role === 'ADMIN'}
        header={
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Profile
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your account settings, preferences, and usage
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {isCloudEnabled() && (
                <>
                  {user.isProfilePublic && (
                    <Button asChild size="sm">
                      <Link
                        href={`/user/${encodeURIComponent(user.name ?? '')}`}
                      >
                        View public profile
                        <ArrowUpRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/discovery">Discovery</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/applications">Applications</Link>
                  </Button>
                </>
              )}
              <LogoutButton />
            </div>
          </div>
        }
      />
    </div>
  )
}
