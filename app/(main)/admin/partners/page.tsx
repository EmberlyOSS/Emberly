import PartnerList from '@/packages/components/admin/partners/partner-list'
import { AdminShell } from '@/packages/components/admin/admin-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Partner Management',
  description: 'Manage partner entries shown on the site.',
})

export default async function PartnersPage() {

    return (
        <AdminShell header={
            <div className="glass-card">
                <div className="p-8">
                    <h1 className="text-3xl font-bold tracking-tight">Partner Management</h1>
                    <p className="text-muted-foreground mt-2">Manage partner entries shown on the site.</p>
                </div>
            </div>
        }>
            <PartnerList />
        </AdminShell>
    )
}
