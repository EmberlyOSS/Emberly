import Link from 'next/link'

import { Metadata } from 'next'

import PageShell from '@/packages/components/layout/PageShell'
import { Alert, AlertDescription, AlertTitle } from '@/packages/components/ui/alert'
import { listLegal } from '@/packages/lib/legal/service'

export const metadata: Metadata = {
  title: 'Legal | Emberly',
  description: 'Emberly legal hub: Terms of Service, Privacy Policy, Cookie Policy, Security Policy, and GDPR information.',
}

function formatUpdated(date?: Date | null) {
  if (!date) return null
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function LegalHubPage() {
  const legalPages = await listLegal({ publishedOnly: true, limit: 100 })
  const rows = legalPages.map((page) => ({
    href: `/legal/${page.slug}`,
    title: page.title,
    summary: page.excerpt ?? '',
    updatedAt: formatUpdated(page.updatedAt ?? page.publishedAt ?? null),
  }))

  return (
    <PageShell title="Legal" subtitle="Terms of Service, Privacy Policy, and other legal documents." bodyVariant="plain">
      <section className="mx-auto w-full space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <Link key={row.href} href={row.href} className="group">
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg shadow-black/5 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-black/10 dark:border-white/10 dark:bg-black/10 dark:shadow-black/20">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 opacity-80 dark:from-white/5 dark:via-transparent dark:to-black/15" />
                <div className="relative flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">{row.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{row.summary || 'Read the full document.'}</p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                      {row.updatedAt ?? 'Up to date'}
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
