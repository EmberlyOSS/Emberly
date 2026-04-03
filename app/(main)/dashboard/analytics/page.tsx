import React from 'react'
import AnalyticsOverview from '@/packages/components/dashboard/analytics/AnalyticsOverview'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Analytics',
  description: 'View analytics and usage statistics for your uploads and files.',
})

export default async function AnalyticsPage() {

    return (
        <div className="container">
            <AnalyticsOverview />
        </div>
    )
}
