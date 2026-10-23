import { URLsClient } from '@/components/dashboard/urls-client'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

import { buildPageMetadata } from '@/lib/embeds/metadata'

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
