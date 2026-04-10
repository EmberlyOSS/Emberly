import dynamic from 'next/dynamic'

import { AdminShell } from '@/packages/components/admin/admin-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Audit Logs',
  description: 'Review system events, security signals, and admin actions.',
})

const AdminAuditLogs = dynamic(() =>
    import('@/packages/components/admin/audit/audit-logs').then((m) => m.AdminAuditLogs)
)

export default async function AdminAuditLogsPage() {

    return (
        <AdminShell header={
            <div className="glass-card">
                <div className="p-8">
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground mt-2">Review system events, security signals, and admin actions.</p>
                </div>
            </div>
        }>
            <AdminAuditLogs />
        </AdminShell>
    )
}
