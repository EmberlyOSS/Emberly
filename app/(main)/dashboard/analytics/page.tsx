import React from 'react'
import AnalyticsOverview from '@/packages/components/dashboard/analytics/AnalyticsOverview'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Analytics',
  description: 'View analytics and usage statistics for your uploads and files.',
})

export default async function AnalyticsPage() {
    return (
        <DashboardShell header={
            <div className="glass-card">
                <div className="p-4 sm:p-6 lg:p-8">
                    <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Overview of your account activity and traffic.
                    </p>
                </div>
            </div>
        }>
            <AnalyticsOverview />
        </DashboardShell>
    )
}
