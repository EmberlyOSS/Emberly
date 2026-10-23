import { UserList } from '@/packages/components/dashboard/user-list'
import { AdminShell } from '@/packages/components/admin/admin-shell'

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'User Management',
  description: 'Manage user accounts, roles, and permissions with ease.',
})

export default async function UsersPage() {
  return (
    <AdminShell
      title="User Management"
      description="Manage user accounts, roles, and permissions"
    >
      <UserList />
    </AdminShell>
  )
}
