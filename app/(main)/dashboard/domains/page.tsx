import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { ProfileDomains } from '@/packages/components/dashboard/domains'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

export const metadata = buildPageMetadata({
  title: 'Custom Domains',
  description: 'Connect your own domains to serve files from branded URLs.',
})

export default async function DomainsPage() {

  return (
    <DashboardShell
      header={
        <div className="glass-card">
          <div className="p-8">
            <h1 className="text-3xl font-bold tracking-tight">Custom Domains</h1>
            <p className="text-muted-foreground mt-2">
              Connect your own domains to serve files from branded URLs.
            </p>
          </div>
        </div>
      }
    >
      <ProfileDomains />
    </DashboardShell>
  )
}
