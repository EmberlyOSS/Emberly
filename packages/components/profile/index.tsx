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
import { ProfileSecurity } from './security'
import ProfileDataExplorer from './data-explorer'
import { ProfileStorage } from './storage'
import { ProfileTools } from './tools'
import { ProfileTestimonials } from './testimonials'
import ProfileAppearance from './appearance'

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

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <div className="overflow-x-auto">
        <TabsList className="min-w-max inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground px-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileAccount user={user} onUpdate={handleRefresh} />
          </CardContent>
        </Card>

        {/* Billing card */}
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.subscription ? (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Current plan</div>
                      <div className="text-sm text-muted-foreground">
                        {user.subscription.productId}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.subscription.status}
                    </div>
                  </div>

                  {user.subscription.currentPeriodEnd && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Expires:{' '}
                      {format(new Date(user.subscription.currentPeriodEnd), 'PPP')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No active subscription</div>
              )}

              <div className="flex gap-2">
                <Button asChild>
                  <a href="/api/payments/portal" className="w-full">
                    Manage billing
                  </a>
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
                  View plans
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileStorage
              quotasEnabled={quotasEnabled}
              formattedQuota={formattedQuota}
              formattedUsed={formattedUsed}
              usagePercentage={usagePercentage}
              fileCount={user.fileCount}
              shortUrlCount={user.shortUrlCount}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileTools />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="testimonials" className="space-y-6">
        <ProfileTestimonials />
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileSecurity onUpdate={handleRefresh} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="data" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProfileExport />

            <Separator className="my-6" />

            <ProfileDataExplorer />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="appearance" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Lazy-load simple appearance selector (client-only) */}
            <ProfileAppearance />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
