import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { isCloudEnabled } from '@/packages/lib/config/env'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

import { SquadsClient } from './client'

export const metadata = buildPageMetadata({
  title: 'Squads',
  description:
    'Create and manage teams with shared uploads, domains, and resources.',
})

export default async function SquadsPage() {
  if (!isCloudEnabled()) redirect('/dashboard')

  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  return (
    <DashboardShell
      title="Squads"
      description="Create and manage teams with shared uploads, domains, and resources"
    >
      <SquadsClient />
    </DashboardShell>
  )
}
