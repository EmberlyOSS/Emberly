'use client'

import { useCallback } from 'react'

import { ProfileClientProps } from '@/packages/types/components/profile'

import { Card, CardContent, CardHeader, CardTitle } from '@/packages/components/ui/card'
import { Button } from '@/packages/components/ui/button'
import { format } from 'date-fns'
import { Separator } from '@/packages/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'

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
  const handleRefresh = useCallback(() => {
    window.location.reload()
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
    <Tabs defaultValue="profile" className="space-y-6">
      <div className="overflow-x-auto">
        <TabsList className="min-w-max inline-flex h-10 items-center justify-start rounded-xl bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/10 dark:border-white/5 p-1 text-muted-foreground gap-1">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white/10 dark:data-[state=active]:bg-white/5 data-[state=active]:text-foreground transition-all">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white/10 dark:data-[state=active]:bg-white/5 data-[state=active]:text-foreground transition-all">Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-white/10 dark:data-[state=active]:bg-white/5 data-[state=active]:text-foreground transition-all">Appearance</TabsTrigger>
          <TabsTrigger value="testimonials" className="rounded-lg data-[state=active]:bg-white/10 dark:data-[state=active]:bg-white/5 data-[state=active]:text-foreground transition-all">Testimonials</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white/10 dark:data-[state=active]:bg-white/5 data-[state=active]:text-foreground transition-all">Security</TabsTrigger>
          <TabsTrigger value="data" className="rounded-lg data-[state=active]:bg-white/10 dark:data-[state=active]:bg-white/5 data-[state=active]:text-foreground transition-all">Data</TabsTrigger>
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

        {/* Billing card */}
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
            </div>
          </GlassCardContent>
        </GlassCard>

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

      <TabsContent value="testimonials" className="space-y-6">
        <ProfileTestimonials />
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Security Settings</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <ProfileSecurity onUpdate={handleRefresh} />
          </GlassCardContent>
        </GlassCard>
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
    </Tabs>
  )
}
