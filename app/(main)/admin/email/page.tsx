import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { AdminShell } from '@/packages/components/admin/admin-shell'
import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Email Broadcasts',
  description: 'Send announcements and operational emails to users.',
})

const AdminEmailManager = dynamic(() =>
    import('@/packages/components/admin/email/email-manager').then((m) => m.AdminEmailManager)
)

export default async function AdminEmailPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'SUPERADMIN')) {
        redirect('/dashboard')
    }

    return (
        <AdminShell header={
            <div className="glass-card">
                <div className="p-8">
                    <h1 className="text-3xl font-bold tracking-tight">Email Broadcasts</h1>
                    <p className="text-muted-foreground mt-2">Send announcements and operational emails to users.</p>
                </div>
            </div>
        }>
            <AdminEmailManager />
        </AdminShell>
    )
}
