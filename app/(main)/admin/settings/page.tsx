import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import PageShell from '@/packages/components/layout/PageShell'
import { authOptions } from '@/packages/lib/auth'

export default async function AdminSettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
        redirect('/dashboard')
    }

    return (
        <PageShell title="Admin Settings" subtitle="Restricted to superadmins" bodyVariant="plain">
            <section className="max-w-4xl mx-auto px-4 py-10 space-y-4">
                <p className="text-sm text-muted-foreground">Admin settings will live here. Access limited to superadmins.</p>
            </section>
        </PageShell>
    )
}
