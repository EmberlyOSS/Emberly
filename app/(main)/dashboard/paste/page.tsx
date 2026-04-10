import { Code2 } from 'lucide-react'

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
      header={
        <div className="glass-card">
          <div className="p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Create New Paste</h1>
                <p className="text-muted-foreground mt-1">
                  Share code snippets with syntax highlighting support
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <PasteForm />
    </DashboardShell>
  )
}
