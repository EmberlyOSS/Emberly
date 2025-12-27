import { VerificationCodesPanel } from '@/packages/components/dashboard/verification-codes-panel'
import { DashboardWrapper } from '@/packages/components/dashboard/dashboard-wrapper'
import { getConfig } from '@/packages/lib/config'

export const dynamic = 'force-dynamic'

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
                <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                    <div className="relative p-8">
                        <h1 className="text-3xl font-bold">Verification Codes</h1>
                        <p className="text-muted-foreground mt-2">View and manage the codes associated with your account.</p>
                    </div>
                </div>
                <VerificationCodesPanel />
            </div>
        </DashboardWrapper>
    )
}
