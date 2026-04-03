import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { ProfileDomains } from '@/packages/components/dashboard/domains'

export const metadata = buildPageMetadata({
  title: 'Custom Domains',
  description: 'Connect your own domains to serve files from branded URLs.',
})

export default async function DomainsPage() {

  return (
    <div className="container space-y-6">
      <div className="glass-card">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">Custom Domains</h1>
          <p className="text-muted-foreground mt-2">
            Connect your own domains to serve files from branded URLs.
          </p>
        </div>
      </div>
      <ProfileDomains />
    </div>
  )
}
