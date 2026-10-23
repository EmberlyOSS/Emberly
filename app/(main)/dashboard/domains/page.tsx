import { redirect } from 'next/navigation'

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { isCloudEnabled } from '@/packages/lib/config/env'
import { ProfileDomains } from '@/packages/components/dashboard/domains'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

export const metadata = buildPageMetadata({
  title: 'Custom Domains',
  description: 'Connect your own domains to serve files from branded URLs.',
})

export default async function DomainsPage() {
  if (!isCloudEnabled()) redirect('/dashboard')

  return (
    <DashboardShell
      title="Custom Domains"
      description="Connect your own domains to serve files from branded URLs."
    >
      <ProfileDomains />
    </DashboardShell>
  )
}
