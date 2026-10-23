import { PasteForm } from '@/components/dashboard/paste-form'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Create Paste',
  description: 'Share code snippets with syntax highlighting support.',
})

export default async function PastePage() {
  return (
    <DashboardShell
      title="Create New Paste"
      description="Share code snippets with syntax highlighting support"
    >
      <PasteForm />
    </DashboardShell>
  )
}
