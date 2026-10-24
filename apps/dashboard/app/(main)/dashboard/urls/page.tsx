import { URLsClient } from '@/components/dashboard/urls-client'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

import { appUrl } from '@/lib/config/env'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Links',
  description: 'Shorten long URLs and monitor their traffic.',
})

export default async function URLsPage() {
  return (
    <DashboardShell
      title="Links"
      description="Shorten long links and see how often they're clicked"
    >
      <URLsClient mainHost={new URL(appUrl()).host} />
    </DashboardShell>
  )
}
