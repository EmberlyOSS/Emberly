import { Github } from 'lucide-react'

import ChangelogList from '@/components/changelogs/ChangelogList'
import PageShell from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Changelog',
  description: 'Releases across all Emberly projects, straight from GitHub.',
})

export default function ChangelogPage() {
  return (
    <PageShell
      eyebrow="Resources"
      title="Changelog"
      subtitle="Releases across all Emberly projects, straight from GitHub."
      actions={
        <Button asChild variant="outline" size="sm">
          <a
            href="https://github.com/EmberlyOSS"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </a>
        </Button>
      }
    >
      <ChangelogList />
    </PageShell>
  )
}
