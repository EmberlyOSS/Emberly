import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { AdminShell } from '@/components/admin/admin-shell'
import { authOptions } from '@/lib/auth'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Settings',
  description: 'Configure system-wide controls, limits, and defaults.',
})

const SettingsManager = dynamic(() =>
  import('@/components/admin/settings/settings-manager').then(
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
      title="Settings"
      description="Configure system-wide controls, limits, and defaults."
    >
      <SettingsManager />
    </AdminShell>
  )
}
