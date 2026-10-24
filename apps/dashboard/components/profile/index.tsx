'use client'

import { useCallback, useMemo, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { ProfileClientProps } from '@/types/components/profile'
import { useFeatures } from '@/components/providers/features-provider'

import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Separator } from '@/components/ui/separator'
import { SectionBar } from '@/components/layout/section-shell'

import { useToast } from '@/hooks/use-toast'
import {
  User as UserIcon,
  CreditCard,
  Upload,
  Shield,
  Gift,
  Users,
  Bell,
  Palette,
  MessageSquare,
  Database,
  Link as LinkIcon,
  ClipboardList,
  Settings,
  KeyRound,
} from 'lucide-react'

import { ProfileAccount } from './account'
import { ProfileSettings } from './account'
import { ProfileDomains } from '../dashboard/domains'
import { DeleteAccount } from './delete-account'
import { ProfileExport } from './export'
import { EmailPreferences } from './notifications'
import { ProfileSecurity } from './security'
import { ProfileStorage } from './storage'
import { ProfileTools } from './tools'
import { ApiKeysPanel } from './api-keys-panel'
import { ProfileTestimonials } from './testimonials'
import ProfileAppearance from './appearance'
import { LinkedAccounts } from './accounts/linked-accounts'
import { PasswordBreachAlert } from './password-breach-alert'
import { ProfileReferrals } from './referrals'
import { BillingCreditsSection } from './billing-credits'
import { ProfilePerks } from './perks'
import { ApplicationsDashboard } from './applications-dashboard'

const profileSections = [
  {
    group: 'Account',
    items: [
      { value: 'profile', label: 'Profile', icon: UserIcon },
      { value: 'settings', label: 'Settings', icon: Settings },
      { value: 'connections', label: 'Connections', icon: LinkIcon },
      { value: 'security', label: 'Security', icon: Shield },
    ],
  },
  {
    group: 'Content',
    items: [
      { value: 'api', label: 'API', icon: KeyRound },
      { value: 'uploads', label: 'Uploads', icon: Upload },
      {
        value: 'applications',
        label: 'Applications',
        icon: ClipboardList,
        cloudOnly: true,
      },
      { value: 'appearance', label: 'Appearance', icon: Palette },
    ],
  },
  {
    group: 'Engagement',
    items: [
      { value: 'notifications', label: 'Notifications', icon: Bell },
      {
        value: 'testimonials',
        label: 'Testimonials',
        icon: MessageSquare,
        cloudOnly: true,
      },
      {
        value: 'referrals',
        label: 'Referrals',
        icon: Users,
        cloudOnly: true,
        billingOnly: true,
      },
      { value: 'perks', label: 'Perks', icon: Gift, cloudOnly: true },
    ],
  },
  {
    group: 'Billing & Data',
    items: [
      {
        value: 'billing',
        label: 'Billing',
        icon: CreditCard,
        cloudOnly: true,
        billingOnly: true,
      },
      { value: 'data', label: 'Data', icon: Database },
    ],
  },
]

function visibleProfileSections(
  cloudEnabled: boolean,
  billingEnabled: boolean,
  hasSubscription: boolean
) {
  return profileSections
    .map((s) => ({
      ...s,
      items: s.items.filter(
        (i) =>
          (!i.cloudOnly || cloudEnabled) &&
          // Subscribers keep the Billing tab in free mode so they can cancel
          (!('billingOnly' in i) ||
            billingEnabled ||
            (i.value === 'billing' && hasSubscription))
      ),
    }))
    .filter((s) => s.items.length > 0)
    .map((s) =>
      s.group === 'Billing & Data' &&
      !s.items.some((i) => i.value === 'billing')
        ? { ...s, group: 'Data' }
        : s
    )
}

// Glass card wrapper component for consistent styling
function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`glass-card transition-all duration-300 ${className}`}>
      {children}
    </div>
  )
}

function GlassCardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  )
}

function GlassCardTitle({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3
      className={`font-semibold leading-none tracking-tight text-lg ${className}`}
    >
      {children}
    </h3>
  )
}

function GlassCardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

function GlassCardContent({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

export function ProfileClient({
  user,
  quotasEnabled,
  formattedQuota,
  formattedUsed,
  usagePercentage,
  header,
}: ProfileClientProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [selectedTab, setSelectedTab] = useState<string>('')
  const { cloud: cloudEnabled, billing: billingEnabled } = useFeatures()
  const hasSubscription = Boolean(user.subscription)
  const sections = useMemo(
    () => visibleProfileSections(cloudEnabled, billingEnabled, hasSubscription),
    [cloudEnabled, billingEnabled, hasSubscription]
  )
  const visibleTabs = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections]
  )

  // Handle OAuth success/error messages
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      toast({
        title: 'Success',
        description: decodeURIComponent(success),
      })
      // Clear query params
      window.history.replaceState({}, '', '/me')
    }

    if (error) {
      toast({
        title: 'Error',
        description: decodeURIComponent(error),
        variant: 'destructive',
      })
      // Clear query params
      window.history.replaceState({}, '', '/me')
    }
  }, [searchParams, toast])

  const handleRefresh = useCallback(() => {
    window.location.reload()
  }, [])

  // Determine default tab - show security if password breach detected
  const defaultTab = useMemo(() => {
    return user.passwordBreachDetectedAt ? 'security' : 'profile'
  }, [user.passwordBreachDetectedAt])

  // Set initial tab from URL query param or default
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && visibleTabs.some((t) => t.value === tabParam)) {
      setSelectedTab(tabParam)
    } else if (!selectedTab) {
      setSelectedTab(defaultTab)
    }
  }, [defaultTab, selectedTab, searchParams, visibleTabs])

  // Update URL when tab changes
  const handleTabChange = useCallback((value: string) => {
    setSelectedTab(value)
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    window.history.pushState({}, '', url.toString())
  }, [])

  // Default email preferences if not set
  const defaultEmailPreferences = {
    security: true,
    account: true,
    billing: true,
    marketing: false,
    productUpdates: true,
  }

  const activeSection = visibleTabs.find((t) => t.value === selectedTab)

  return (
    <div className="space-y-6">
      <SectionBar
        label="Profile"
        activeKey={selectedTab}
        groups={sections.map((section) => ({
          label: section.group,
          items: section.items.map((item) => ({
            key: item.value,
            label: item.label,
            icon: item.icon,
            onSelect: () => handleTabChange(item.value),
          })),
        }))}
      />

      <div className="space-y-6">
        {header}
        {selectedTab === 'profile' && (
          <>
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Profile</GlassCardTitle>
                <GlassCardDescription>
                  How you appear to other people.
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <ProfileAccount user={user} onUpdate={handleRefresh} />
              </GlassCardContent>
            </GlassCard>
          </>
        )}

        {selectedTab === 'settings' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Settings</GlassCardTitle>
              <GlassCardDescription>
                Who can see your profile, and defaults for new uploads.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <ProfileSettings user={user} onUpdate={handleRefresh} />
            </GlassCardContent>
          </GlassCard>
        )}

        {selectedTab === 'connections' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Connections</GlassCardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your social accounts to unlock perks and use their
                avatars
              </p>
            </GlassCardHeader>
            <GlassCardContent>
              <LinkedAccounts />
            </GlassCardContent>
          </GlassCard>
        )}

        {selectedTab === 'billing' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Billing</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                {user.subscription ? (
                  <div className="p-4 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Current plan</div>
                        <div className="text-sm text-muted-foreground">
                          {user.subscription.productName ??
                            user.subscription.productId}
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {user.subscription.status}
                      </span>
                    </div>

                    {user.subscription.currentPeriodEnd && (
                      <div className="mt-3 pt-3 border-t border-border/50 dark:border-border/20 text-sm text-muted-foreground">
                        Renews:{' '}
                        {format(
                          new Date(user.subscription.currentPeriodEnd),
                          'PPP'
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 text-sm text-muted-foreground">
                    No active subscription — if you recently subscribed,{' '}
                    <button
                      className="text-primary underline underline-offset-2 hover:no-underline"
                      onClick={async () => {
                        await fetch('/api/payments/sync-subscription', {
                          method: 'POST',
                        })
                        window.location.reload()
                      }}
                    >
                      click here to sync
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    asChild
                    className="flex-1 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all"
                  >
                    <a href="/api/payments/portal">Manage billing</a>
                  </Button>
                  {billingEnabled && (
                    <Button
                      variant="outline"
                      onClick={() => (window.location.href = '/pricing')}
                      className="border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      View plans
                    </Button>
                  )}
                </div>

                {billingEnabled && <BillingCreditsSection />}
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        {selectedTab === 'uploads' && (
          <>
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Storage</GlassCardTitle>
                <GlassCardDescription>
                  {quotasEnabled
                    ? 'How much of your storage you have used.'
                    : 'How much storage you are using.'}
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <ProfileStorage
                  quotasEnabled={quotasEnabled}
                  formattedQuota={formattedQuota}
                  formattedUsed={formattedUsed}
                  usagePercentage={usagePercentage}
                  fileCount={user.fileCount}
                  shortUrlCount={user.shortUrlCount}
                />
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Upload tools</GlassCardTitle>
                <GlassCardDescription>
                  Choose your upload domain and download ready-made configs for
                  your screenshot tools.
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <ProfileTools />
              </GlassCardContent>
            </GlassCard>
          </>
        )}

        {selectedTab === 'api' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>API Keys</GlassCardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your API keys and upload token for external integrations
              </p>
            </GlassCardHeader>
            <GlassCardContent>
              <ApiKeysPanel />
            </GlassCardContent>
          </GlassCard>
        )}

        {selectedTab === 'security' && (
          <>
            <PasswordBreachAlert
              passwordBreachDetectedAt={user.passwordBreachDetectedAt}
            />
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Security</GlassCardTitle>
                <GlassCardDescription>
                  Your password, two-factor authentication, devices and sign-in
                  history.
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <ProfileSecurity onUpdate={handleRefresh} />
              </GlassCardContent>
            </GlassCard>
          </>
        )}

        {selectedTab === 'perks' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Your Perks</GlassCardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View your active perks and discover new ones to unlock
              </p>
            </GlassCardHeader>
            <GlassCardContent>
              <ProfilePerks />
            </GlassCardContent>
          </GlassCard>
        )}

        {selectedTab === 'referrals' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Referral Program</GlassCardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Earn $10 billing credits for each friend who signs up using your
                referral link. They also get $10 credit!
              </p>
            </GlassCardHeader>
            <GlassCardContent>
              <ProfileReferrals />
            </GlassCardContent>
          </GlassCard>
        )}

        {selectedTab === 'notifications' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Notifications</GlassCardTitle>
              <GlassCardDescription>
                Choose where you hear about activity on your account.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <EmailPreferences
                userId={user.id}
                emailNotificationsEnabled={
                  user.emailNotificationsEnabled ?? true
                }
                emailPreferences={
                  user.emailPreferences ?? defaultEmailPreferences
                }
                discordWebhookUrl={user.discordWebhookUrl ?? null}
                discordNotificationsEnabled={
                  user.discordNotificationsEnabled ?? false
                }
                discordPreferences={
                  user.discordPreferences ?? {
                    security: true,
                    account: false,
                    billing: true,
                    marketing: false,
                    productUpdates: false,
                  }
                }
                onUpdate={handleRefresh}
              />
            </GlassCardContent>
          </GlassCard>
        )}

        {selectedTab === 'appearance' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Appearance</GlassCardTitle>
              <GlassCardDescription>
                Pick a theme for the dashboard. Changes preview straight away.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <ProfileAppearance />
            </GlassCardContent>
          </GlassCard>
        )}

        {selectedTab === 'testimonials' && <ProfileTestimonials />}

        {selectedTab === 'applications' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Your Applications</GlassCardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your applications for staff, partnerships,
                verification, and ban appeals
              </p>
            </GlassCardHeader>
            <GlassCardContent>
              <ApplicationsDashboard />
            </GlassCardContent>
          </GlassCard>
        )}

        {selectedTab === 'data' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Data</GlassCardTitle>
              <GlassCardDescription>
                Get a copy of everything stored about your account, or delete
                it.
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
              <ProfileExport />

              <DeleteAccount />
            </GlassCardContent>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
