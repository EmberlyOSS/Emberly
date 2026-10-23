import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { AdminShell } from '@/components/admin/admin-shell'
import { authOptions } from '@/lib/auth'
import { isCloudEnabled } from '@/lib/config/env'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Email Broadcasts',
  description: 'Send announcements and operational emails to users.',
})

const AdminEmailManager = dynamic(() =>
  import('@/components/admin/email/email-manager').then(
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
