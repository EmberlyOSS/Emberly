import { VerificationCodesPanel } from '@/packages/components/dashboard/verification-codes-panel'
import { DashboardWrapper } from '@/packages/components/dashboard/dashboard-wrapper'
import { getConfig } from '@/packages/lib/config'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const dynamic = 'force-dynamic'

export const metadata = buildPageMetadata({
  title: 'Verification Codes',
  description: 'View and manage the codes associated with your account.',
})

export default async function VerificationCodesPage() {
    const config = await getConfig()
    const maxUploadConfig = config.settings.general.storage.maxUploadSize
    const multiplier = maxUploadConfig.unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024
    const maxUploadSizeBytes = maxUploadConfig.value * multiplier

    return (
        <DashboardWrapper
            nav="dashboard"
            showFooter={config.settings.general.credits.showFooter}
            maxUploadSize={maxUploadSizeBytes}
        >
            <div className="container space-y-6 max-w-4xl">
                <div className="glass-card">
                    <div className="p-8">
                        <h1 className="text-3xl font-bold tracking-tight">Verification Codes</h1>
                        <p className="text-muted-foreground mt-2">View and manage the codes associated with your account.</p>
                    </div>
                </div>
                <VerificationCodesPanel />
            </div>
        </DashboardWrapper>
    )
}
