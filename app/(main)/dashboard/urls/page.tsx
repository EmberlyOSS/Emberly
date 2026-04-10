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
      header={
        <div className="glass-card">
          <div className="p-8">
            <h1 className="text-3xl font-bold tracking-tight">URL Shortener</h1>
            <p className="text-muted-foreground mt-2">
              Shorten long URLs and monitor their traffic
            </p>
          </div>
        </div>
      }
    >
      <URLsClient />
    </DashboardShell>
  )
}
