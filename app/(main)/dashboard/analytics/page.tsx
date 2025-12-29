import React from 'react'
import AnalyticsOverview from '@/packages/components/dashboard/analytics/AnalyticsOverview'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Analytics',
  description: 'View analytics and usage statistics for your uploads and files.',
})

export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        // let the dashboard wrapper handle redirects or show empty state
    }

    return (
        <div className="container space-y-6">
            <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                <div className="relative p-8">
                    <AnalyticsOverview />
                </div>
            </div>
        </div>
    )
}
