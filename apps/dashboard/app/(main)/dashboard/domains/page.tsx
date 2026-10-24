import { redirect } from 'next/navigation'

import { buildPageMetadata } from '@/lib/embeds/metadata'
import { isCloudEnabled } from '@/lib/config/env'
import { ProfileDomains } from '@/components/dashboard/domains'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const metadata = buildPageMetadata({
  title: 'Domains',
  description: 'Connect your own domains to serve files from branded URLs.',
})

export default async function DomainsPage() {
  if (!isCloudEnabled()) redirect('/dashboard')

  return (
    <DashboardShell
      title="Domains"
      description="Connect your own domains to serve files from branded URLs."
    >
      <ProfileDomains />
    </DashboardShell>
  )
}
