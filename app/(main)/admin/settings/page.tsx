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
    <AdminShell header={
      <div className="glass-card">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground mt-2">Configure system-wide controls, limits, and defaults.</p>
        </div>
      </div>
    }>
      <SettingsManager />
    </AdminShell>
  )
}
