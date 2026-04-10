import { UserList } from '@/packages/components/dashboard/user-list'
import { AdminShell } from '@/packages/components/admin/admin-shell'

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'User Management',
  description: 'Manage user accounts, roles, and permissions.',
})

export default async function UsersPage() {

  return (
    <AdminShell header={
      <div className="glass-card">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts, roles, and permissions
          </p>
        </div>
      </div>
    }>
      <UserList />
    </AdminShell>
  )
}
