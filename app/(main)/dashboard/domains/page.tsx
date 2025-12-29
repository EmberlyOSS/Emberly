import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { ProfileDomains } from '@/packages/components/dashboard/domains'

export const metadata = buildPageMetadata({
  title: 'Custom Domains',
  description: 'Connect your own domains to serve files from branded URLs.',
})

export default async function DomainsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Custom Domains</h1>
        <p className="text-muted-foreground">
          Connect your own domains to serve files from branded URLs.
        </p>
      </div>
      <ProfileDomains />
    </div>
  )
}
