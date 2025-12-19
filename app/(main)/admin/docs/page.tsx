import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { DashboardWrapper } from '@/packages/components/dashboard/dashboard-wrapper'
import { getServerSession } from 'next-auth'
import { getConfig } from '@/packages/lib/config'
import { authOptions } from '@/packages/lib/auth'

const DocManager = dynamic(() =>
    import('@/packages/components/admin/docs/doc-manager').then((m) => m.DocManager)
)

export default async function DocsDashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
        redirect('/dashboard')
    }

    const config = await getConfig()
    const { value, unit } = config.settings.general.storage.maxUploadSize
    const maxSizeBytes = value * (unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024)

    return (
        <DashboardWrapper showFooter={false} maxUploadSize={maxSizeBytes}>
            <DocManager />
        </DashboardWrapper>
    )
}
