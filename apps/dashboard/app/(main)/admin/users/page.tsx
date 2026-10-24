import { UserList } from '@/components/dashboard/user-list'
import { AdminShell } from '@/components/admin/admin-shell'

import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Users',
  description: 'Manage user accounts, roles, and permissions with ease.',
})

export default async function UsersPage() {
  return (
    <AdminShell
      title="Users"
      description="Manage user accounts, roles, and permissions"
    >
      <UserList />
    </AdminShell>
  )
}
