import React from 'react'
import AnalyticsOverview from '@/packages/components/dashboard/analytics/AnalyticsOverview'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Analytics',
  description:
    'View analytics and usage statistics for your uploads and files.',
})

export default async function AnalyticsPage() {
  return (
    <DashboardShell
      title="Analytics"
      description="Overview of your account activity and traffic."
    >
      <AnalyticsOverview />
    </DashboardShell>
  )
}
