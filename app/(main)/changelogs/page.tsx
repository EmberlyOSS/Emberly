import React from 'react'
import ChangelogList from '@/packages/components/changelogs/ChangelogList'
import { DashboardWrapper } from '@/packages/components/dashboard/dashboard-wrapper'
import { getConfig } from '@/packages/lib/config'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
    title: 'Changelogs',
    description: 'View releases across all of the Emberly services. Powered by GitHub Releases!',
})

export default async function Page() {
    const config = await getConfig()
    const { value, unit } = config.settings.general.storage.maxUploadSize
    const maxSizeBytes = value * (unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024)

    return (
        <DashboardWrapper nav="base" showFooter={config.settings.general.credits.showFooter} maxUploadSize={maxSizeBytes}>
            <div className="container space-y-6">
                <div className="glass-card">
                    <div className="p-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Changelogs</h1>
                                <p className="text-muted-foreground mt-2">View releases across all of the Emberly services. Powered by GitHub Releases!</p>
                            </div>
                        </div>
                    </div>
                </div>

                <ChangelogList />
            </div>
        </DashboardWrapper>
    )
}
