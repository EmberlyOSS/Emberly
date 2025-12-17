import React from 'react'
import ChangelogList from '@/packages/components/changelogs/ChangelogList'
import { DashboardWrapper } from '@/packages/components/dashboard/dashboard-wrapper'
import { getConfig } from '@/packages/lib/config'

export default async function Page() {
    const config = await getConfig()
    const { value, unit } = config.settings.general.storage.maxUploadSize
    const maxSizeBytes = value * (unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024)

    return (
        <DashboardWrapper nav="base" showFooter={config.settings.general.credits.showFooter} maxUploadSize={maxSizeBytes}>
            <div className="container space-y-6">
                <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                    <div className="relative p-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold">Changelogs</h1>
                                <p className="text-muted-foreground mt-2">View releases across all of the Emberly services. Powered by GitHub Releases!</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                    <div className="relative p-8">
                        <ChangelogList />
                    </div>
                </div>
            </div>
        </DashboardWrapper>
    )
}
