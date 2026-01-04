'use client'

import { useCallback, useMemo, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { ProfileClientProps } from '@/packages/types/components/profile'

import { Card, CardContent, CardHeader, CardTitle } from '@/packages/components/ui/card'
import { Button } from '@/packages/components/ui/button'
import { format } from 'date-fns'
import { Separator } from '@/packages/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
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
} from 'lucide-react'

import { ProfileAccount } from './account'
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

const profileTabs = [
  { value: 'profile', label: 'Profile', icon: UserIcon },
  { value: 'billing', label: 'Billing', icon: CreditCard },
  { value: 'uploads', label: 'Uploads', icon: Upload },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'perks', label: 'Perks', icon: Gift },
  { value: 'referrals', label: 'Referrals', icon: Users },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'appearance', label: 'Appearance', icon: Palette },
  { value: 'testimonials', label: 'Testimonials', icon: MessageSquare },
  { value: 'data', label: 'Data', icon: Database },
]

// Glass card wrapper component for consistent styling
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-xl bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/10 dark:border-white/5 shadow-lg shadow-black/5 ${className}`}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 dark:from-white/[0.02] dark:via-transparent dark:to-black/5 pointer-events-none" />
      <div className="relative">
        {children}
      </div>
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
      window.history.replaceState({}, '', '/dashboard/profile')
    }

    if (error) {
      toast({
        title: 'Error',
        description: decodeURIComponent(error),
        variant: 'destructive',
      })
      // Clear query params
      window.history.replaceState({}, '', '/dashboard/profile')
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
    if (tabParam && profileTabs.some(t => t.value === tabParam)) {
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

  return (
    <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-xl blur-xl" />
        <TabsList className="relative w-full h-auto flex-wrap justify-start gap-1 p-1.5 bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-xl">
          {profileTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/20 transition-all duration-200 hover:bg-white/5"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>

      <TabsContent value="profile" className="space-y-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Profile Information</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <ProfileAccount user={user} onUpdate={handleRefresh} />
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Linked Accounts</GlassCardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your social accounts to unlock exclusive perks and features
            </p>
          </GlassCardHeader>
          <GlassCardContent>
            <LinkedAccounts />
          </GlassCardContent>
        </GlassCard>
      </TabsContent>

      <TabsContent value="billing" className="space-y-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Billing</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {user.subscription ? (
                <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Current plan</div>
                      <div className="text-sm text-muted-foreground">
                        {user.subscription.productId}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {user.subscription.status}
                    </span>
                  </div>

                  {user.subscription.currentPeriodEnd && (
                    <div className="mt-3 pt-3 border-t border-white/10 dark:border-white/5 text-sm text-muted-foreground">
                      Expires:{' '}
                      {format(new Date(user.subscription.currentPeriodEnd), 'PPP')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 text-sm text-muted-foreground">
                  No active subscription
                </div>
              )}

              <div className="flex gap-3">
                <Button asChild className="flex-1 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all">
                  <a href="/api/payments/portal">
                    Manage billing
                  </a>
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/pricing'} className="border-border/50 hover:bg-white/5 transition-colors">
                  View plans
                </Button>
              </div>

              {/* Billing Credits Section */}
              <BillingCreditsSection />
            </div>
          </GlassCardContent>
        </GlassCard>
      </TabsContent>

      <TabsContent value="uploads" className="space-y-6">
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
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <PasswordBreachAlert passwordBreachDetectedAt={user.passwordBreachDetectedAt} />
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Security Settings</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <ProfileSecurity onUpdate={handleRefresh} />
          </GlassCardContent>
        </GlassCard>
      </TabsContent>

      <TabsContent value="perks" className="space-y-6">
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
      </TabsContent>

      <TabsContent value="referrals" className="space-y-6">
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
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Email Notifications</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <EmailPreferences
              userId={user.id}
              emailNotificationsEnabled={user.emailNotificationsEnabled ?? true}
              emailPreferences={user.emailPreferences ?? defaultEmailPreferences}
              onUpdate={handleRefresh}
            />
          </GlassCardContent>
        </GlassCard>
      </TabsContent>

      <TabsContent value="appearance" className="space-y-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Appearance</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {/* Lazy-load simple appearance selector (client-only) */}
            <ProfileAppearance />
          </GlassCardContent>
        </GlassCard>
      </TabsContent>

      <TabsContent value="testimonials" className="space-y-6">
        <ProfileTestimonials />
      </TabsContent>

      <TabsContent value="data" className="space-y-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Data</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            <ProfileExport />

            <Separator className="my-6 bg-white/10" />

            <ProfileDataExplorer />
          </GlassCardContent>
        </GlassCard>
      </TabsContent>
    </Tabs>
  )
}
