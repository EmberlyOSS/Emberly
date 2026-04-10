import { VerificationCodesPanel } from '@/packages/components/dashboard/verification-codes-panel'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const dynamic = 'force-dynamic'

export const metadata = buildPageMetadata({
  title: 'Verification Codes',
  description: 'View and manage the codes associated with your account.',
})

export default async function VerificationCodesPage() {
    return (
        <DashboardShell
            header={
                <div className="glass-card">
                    <div className="p-8">
                        <h1 className="text-3xl font-bold tracking-tight">Verification Codes</h1>
                        <p className="text-muted-foreground mt-2">View and manage the codes associated with your account.</p>
                    </div>
                </div>
            }
        >
            <VerificationCodesPanel />
        </DashboardShell>
    )
}
