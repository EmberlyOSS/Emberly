import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

export const metadata = buildPageMetadata({
  title: 'Files',
  description: 'View and manage your uploaded files.',
})

import { FilesClient } from './client'

export default async function FilesPage() {
  return (
    <DashboardShell header={
      <div className="glass-card">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground mt-2">View and manage your uploaded files.</p>
        </div>
      </div>
    }>
      <FilesClient />
    </DashboardShell>
  )
}
