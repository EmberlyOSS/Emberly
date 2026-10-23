import { redirect } from 'next/navigation'

import Link from 'next/link'

import PageShell from '@/packages/components/layout/PageShell'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/packages/components/ui/alert'
import { isCloudEnabled } from '@/packages/lib/config/env'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { LEGAL_DOCUMENTS } from '@/packages/lib/legal/documents'

export const metadata = buildPageMetadata({
  title: 'Legal',
  description:
    'Emberly legal hub: Terms of Service, Privacy Policy, Acceptable Use, Cookie, Copyright and Security policies.',
})

function formatUpdated(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function LegalHubPage() {
  if (!isCloudEnabled()) redirect('/')

  const rows = LEGAL_DOCUMENTS.map((doc) => ({
    href: `/legal/${doc.slug}`,
    title: doc.title,
    summary: doc.summary,
    updatedAt: formatUpdated(doc.updatedAt),
  }))

  return (
    <PageShell
      title="Legal"
      subtitle="Terms of Service, Privacy Policy, and other legal documents."
    >
      <section className="mx-auto w-full space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <Link key={row.href} href={row.href} className="group">
              <div className="glass-card glass-hover h-full overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5">
                <div className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                        {row.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {row.summary || 'Read the full document.'}
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                      {row.updatedAt}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <span>Read</span>
                    <span aria-hidden>→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
