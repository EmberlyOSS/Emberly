import { URLsClient } from '@/packages/components/dashboard/urls-client'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'URL Shortener',
  description: 'Shorten long URLs and monitor their traffic.',
})

export default async function URLsPage() {
  return (
    <DashboardShell
      title="URL Shortener"
      description="Shorten long URLs and monitor their traffic"
    >
      <URLsClient />
    </DashboardShell>
  )
}
