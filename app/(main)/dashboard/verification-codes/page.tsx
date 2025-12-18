import { VerificationCodesPanel } from '@/packages/components/dashboard/verification-codes-panel'
import { DashboardWrapper } from '@/packages/components/dashboard/dashboard-wrapper'
import { getConfig } from '@/packages/lib/config'

export const dynamic = 'force-dynamic'

export default async function VerificationCodesPage() {
    const config = await getConfig()
    const maxUploadSizeMb = config.settings?.storage?.maxUploadSizeMb ?? 1024
    const maxUploadSizeBytes = maxUploadSizeMb * 1024 * 1024

    return (
        <DashboardWrapper
            nav="dashboard"
            showFooter={config.settings.general.credits.showFooter}
            maxUploadSize={maxUploadSizeBytes}
        >
            <div className="grid gap-6 max-w-4xl">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold">Verification codes</h1>
                    <p className="text-muted-foreground">View and manage the codes associated with your account.</p>
                </div>
                <VerificationCodesPanel />
            </div>
        </DashboardWrapper>
    )
}
