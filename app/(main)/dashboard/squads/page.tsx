import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

import { SquadsClient } from './client'

export const metadata = buildPageMetadata({
  title: 'Squads',
  description: 'Create and manage teams with shared uploads, domains, and resources.',
})

export default async function SquadsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  return (
    <DashboardShell
      header={
        <div className="glass-card">
          <div className="p-8">
            <h1 className="text-3xl font-bold tracking-tight">Squads</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage teams with shared uploads, domains, and resources
            </p>
          </div>
        </div>
      }
    >
      <SquadsClient />
    </DashboardShell>
  )
}
