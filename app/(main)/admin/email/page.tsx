import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { AdminShell } from '@/packages/components/admin/admin-shell'
import { authOptions } from '@/packages/lib/auth'
import { isCloudEnabled } from '@/packages/lib/config/env'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Email Broadcasts',
  description: 'Send announcements and operational emails to users.',
})

const AdminEmailManager = dynamic(() =>
  import('@/packages/components/admin/email/email-manager').then(
    (m) => m.AdminEmailManager
  )
)

export default async function AdminEmailPage() {
  if (!isCloudEnabled()) redirect('/admin')

  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  return (
    <AdminShell
      title="Email Broadcasts"
      description="Send announcements and operational emails to users."
    >
      <AdminEmailManager />
    </AdminShell>
  )
}
