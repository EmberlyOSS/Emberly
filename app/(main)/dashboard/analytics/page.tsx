import React from 'react'
import AnalyticsOverview from '@/packages/components/dashboard/analytics/AnalyticsOverview'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'

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
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Analytics</h1>
                            <p className="text-muted-foreground mt-2">Overview of your account activity and traffic.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                <div className="relative p-8">
                    <AnalyticsOverview />
                </div>
            </div>
        </div>
    )
}
