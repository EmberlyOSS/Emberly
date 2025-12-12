import React from 'react'
import AnalyticsOverview from '@/components/dashboard/analytics/AnalyticsOverview'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        // let the dashboard wrapper handle redirects or show empty state
    }

    return (
        <main className="container mx-auto py-8">
            <section className="max-w-5xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold">Analytics</h1>
                </div>

                <AnalyticsOverview />
            </section>
        </main>
    )
}
