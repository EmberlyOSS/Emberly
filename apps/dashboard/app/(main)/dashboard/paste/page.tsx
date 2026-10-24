import { PasteForm } from '@/components/dashboard/paste-form'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'New paste',
  description: 'Share code snippets with syntax highlighting support.',
})

export default async function PastePage() {
  return (
    <DashboardShell
      title="New paste"
      description="Share code and text with syntax highlighting"
    >
      <PasteForm />
    </DashboardShell>
  )
}
