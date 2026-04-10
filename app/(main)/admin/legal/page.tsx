import dynamic from 'next/dynamic'

import { AdminShell } from '@/packages/components/admin/admin-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Legal Pages',
  description: 'Manage policies, terms, and public legal documents.',
})

const LegalManager = dynamic(() =>
    import('@/packages/components/admin/legal/legal-manager').then((m) => m.LegalManager)
)

export default async function LegalDashboardPage() {

    return (
        <AdminShell header={
            <div className="glass-card">
                <div className="p-8">
                    <h1 className="text-3xl font-bold tracking-tight">Legal Pages</h1>
                    <p className="text-muted-foreground mt-2">Manage policies, terms, and public legal documents.</p>
                </div>
            </div>
        }>
            <LegalManager />
        </AdminShell>
    )
}
