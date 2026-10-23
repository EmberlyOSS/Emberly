import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { AdminShell } from '@/packages/components/admin/admin-shell'
import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Platform Settings',
  description: 'Configure system-wide controls, limits, and defaults.',
})

const SettingsManager = dynamic(() =>
  import('@/packages/components/admin/settings/settings-manager').then(
    (m) => m.SettingsManager
  )
)

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  return (
    <AdminShell
      title="Platform Settings"
      description="Configure system-wide controls, limits, and defaults."
    >
      <SettingsManager />
    </AdminShell>
  )
}
