import PartnerList from '@/components/admin/partners/partner-list'
import { AdminShell } from '@/components/admin/admin-shell'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Partner Management',
  description: 'Manage partner entries shown on the site.',
})

export default async function PartnersPage() {
  return (
    <AdminShell
      title="Partner Management"
      description="Manage partner entries shown on the site."
    >
      <PartnerList />
    </AdminShell>
  )
}
