'use client'

import { useCallback, useMemo, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { ProfileClientProps } from '@/packages/types/components/profile'

import { Button } from '@/packages/components/ui/button'
import { format } from 'date-fns'
import { Separator } from '@/packages/components/ui/separator'
import { ScrollIndicator } from '@/packages/components/ui/scroll-indicator'

import { useToast } from '@/packages/hooks/use-toast'
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
} from 'lucide-react'

import { ProfileAccount } from './account'
import { ProfileSettings } from './account'
import { ProfileDomains } from '../dashboard/domains'
import { ProfileExport } from './export'
import { EmailPreferences } from './notifications'
import { ProfileSecurity } from './security'
import ProfileDataExplorer from './data-explorer'
import { ProfileStorage } from './storage'
import { ProfileTools } from './tools'
import { ProfileTestimonials } from './testimonials'
import ProfileAppearance from './appearance'
import { LinkedAccounts } from './accounts/linked-accounts'
import { PasswordBreachAlert } from './password-breach-alert'
import { ProfileReferrals } from './referrals'
import { BillingCreditsSection } from './billing-credits'
import { ProfilePerks } from './perks'
import { ApplicationsDashboard } from './applications-dashboard'

const profileSections = [
  { group: 'Account', items: [
    { value: 'profile', label: 'Profile', icon: UserIcon },
    { value: 'settings', label: 'Settings', icon: Settings },
    { value: 'connections', label: 'Connections', icon: LinkIcon },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'appearance', label: 'Appearance', icon: Palette },
  ]},
  { group: 'Content', items: [
    { value: 'uploads', label: 'Uploads', icon: Upload },
    { value: 'applications', label: 'Applications', icon: ClipboardList },
  ]},
  { group: 'Engagement', items: [
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'testimonials', label: 'Testimonials', icon: MessageSquare },
    { value: 'perks', label: 'Perks', icon: Gift },
    { value: 'referrals', label: 'Referrals', icon: Users },
  ]},
  { group: 'Billing & Data', items: [
    { value: 'billing', label: 'Billing', icon: CreditCard },
    { value: 'data', label: 'Data', icon: Database },
  ]},
]

const allTabs = profileSections.flatMap(s => s.items)

// Glass card wrapper component for consistent styling
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card transition-all duration-300 ${className}`}>
      {children}
    </div>
  )
}

function GlassCardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
}

function GlassCardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`font-semibold leading-none tracking-tight text-lg ${className}`}>{children}</h3>
}

function GlassCardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

export function ProfileClient({
  user,
  quotasEnabled,
  formattedQuota,
  formattedUsed,
  usagePercentage,
}: ProfileClientProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [selectedTab, setSelectedTab] = useState<string>('')

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
    if (tabParam && allTabs.some(t => t.value === tabParam)) {
      setSelectedTab(tabParam)
    } else if (!selectedTab) {
      setSelectedTab(defaultTab)
    }
  }, [defaultTab, selectedTab, searchParams])

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

  const activeSection = allTabs.find(t => t.value === selectedTab)

  return (
    <div className="flex flex-col lg:flex-row gap-6 overflow-hidden lg:items-start">
      {/* Sidebar Navigation — full on desktop, horizontal scroll on mobile */}
      <nav className="lg:w-56 shrink-0">
        {/* Mobile: horizontal scrollable strip */}
        <ScrollIndicator className="lg:hidden glass-subtle rounded-xl p-1.5">
          <div className="flex gap-1 w-max">
            {allTabs.map((item) => {
              const Icon = item.icon
              const isActive = selectedTab === item.value
              return (
                <button
                  key={item.value}
                  onClick={() => handleTabChange(item.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {isActive && item.label}
                </button>
              )
            })}
          </div>
        </ScrollIndicator>

        {/* Desktop: full grouped sidebar */}
        <div className="hidden lg:block glass-subtle rounded-xl p-2 lg:sticky lg:top-24 space-y-3">
          {profileSections.map((section) => (
            <div key={section.group}>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {section.group}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = selectedTab === item.value
                  return (
                    <button
                      key={item.value}
                      onClick={() => handleTabChange(item.value)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
      {selectedTab === 'profile' && (
        <>
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Profile Information</GlassCardTitle>
            <p className="text-sm text-muted-foreground mt-1">Your identity, bio, and social links</p>
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
            <p className="text-sm text-muted-foreground mt-1">Control visibility, expiry defaults, and file URL options</p>
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
              Connect your social accounts to unlock perks and use their avatars
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
                        {user.subscription.productName ?? user.subscription.productId}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {user.subscription.status}
                    </span>
                  </div>

                  {user.subscription.currentPeriodEnd && (
                    <div className="mt-3 pt-3 border-t border-border/50 dark:border-border/20 text-sm text-muted-foreground">
                      Renews:{' '}
                      {format(new Date(user.subscription.currentPeriodEnd), 'PPP')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 text-sm text-muted-foreground">
                  No active subscription — if you recently subscribed,{' '}
                  <button
                    className="text-primary underline underline-offset-2 hover:no-underline"
                    onClick={async () => {
                      await fetch('/api/payments/sync-subscription', { method: 'POST' })
                      window.location.reload()
                    }}
                  >
                    click here to sync
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <Button asChild className="flex-1 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all">
                  <a href="/api/payments/portal">
                    Manage billing
                  </a>
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/pricing'} className="border-border/50 hover:bg-muted/30 transition-colors">
                  View plans
                </Button>
              </div>

              {/* Billing Credits Section */}
              <BillingCreditsSection />
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {selectedTab === 'uploads' && (
        <>
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Storage Usage</GlassCardTitle>
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
            <GlassCardTitle>Upload Tools</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <ProfileTools />
          </GlassCardContent>
        </GlassCard>
        </>
      )}

      {selectedTab === 'security' && (
        <>
        <PasswordBreachAlert passwordBreachDetectedAt={user.passwordBreachDetectedAt} />
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Security Settings</GlassCardTitle>
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
              Earn $10 billing credits for each friend who signs up using your referral link. They also get $10 credit!
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
            <GlassCardTitle>Email Notifications</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <EmailPreferences
              userId={user.id}
              emailNotificationsEnabled={user.emailNotificationsEnabled ?? true}
              emailPreferences={user.emailPreferences ?? defaultEmailPreferences}
              discordWebhookUrl={user.discordWebhookUrl ?? null}
              discordNotificationsEnabled={user.discordNotificationsEnabled ?? false}
              discordPreferences={user.discordPreferences ?? {
                security: true,
                account: false,
                billing: true,
                marketing: false,
                productUpdates: false,
              }}
              onUpdate={handleRefresh}
            />
          </GlassCardContent>
        </GlassCard>
      )}

      {selectedTab === 'appearance' && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Appearance</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <ProfileAppearance />
          </GlassCardContent>
        </GlassCard>
      )}

      {selectedTab === 'testimonials' && (
        <ProfileTestimonials />
      )}

      {selectedTab === 'applications' && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Your Applications</GlassCardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your applications for staff, partnerships, verification, and ban appeals
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
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            <ProfileExport />

            <Separator className="my-6 bg-muted/50" />

            <ProfileDataExplorer />
          </GlassCardContent>
        </GlassCard>
      )}


      </div>
    </div>
  )
}
