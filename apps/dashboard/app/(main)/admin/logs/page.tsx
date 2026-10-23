import dynamic from 'next/dynamic'

import { AdminShell } from '@/components/admin/admin-shell'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Audit Logs',
  description: 'Review system events, security signals, and admin actions.',
})

const AdminAuditLogs = dynamic(() =>
  import('@/components/admin/audit/audit-logs').then(
    (m) => m.AdminAuditLogs
  )
)

export default async function AdminAuditLogsPage() {
  return (
    <AdminShell
      title="Audit Logs"
      description="Review system events, security signals, and admin actions."
    >
      <AdminAuditLogs />
    </AdminShell>
  )
}
