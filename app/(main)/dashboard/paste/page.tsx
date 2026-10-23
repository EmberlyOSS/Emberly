import { PasteForm } from '@/packages/components/dashboard/paste-form'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

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
