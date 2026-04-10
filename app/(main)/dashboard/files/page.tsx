import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

export const metadata = buildPageMetadata({
  title: 'Files',
  description: 'View and manage your uploaded files.',
})

import { FilesClient } from './client'

export default async function FilesPage() {
  return (
    <DashboardShell>
      <FilesClient />
    </DashboardShell>
  )
}
