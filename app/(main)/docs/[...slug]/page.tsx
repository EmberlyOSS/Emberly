import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GithubSlugger from 'github-slugger'

import DocsToc from '@/packages/components/docs/DocsToc'
import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'
import { docLinks } from '@/packages/components/docs/nav-links'
import PageShell from '@/packages/components/layout/PageShell'
import { getDocByCategorySlug, inferCategoryAndSlug, listDocs } from '@/packages/lib/docs/service'

type TocHeading = {
    id: string
    text: string
    level: 2 | 3
}

function extractHeadings(markdown: string): TocHeading[] {
    const lines = markdown.split('\n')
    const headings: TocHeading[] = []
    const slugger = new GithubSlugger()

    let inCode = false

    for (const rawLine of lines) {
        const line = rawLine.trim()

        if (line.startsWith('```')) {
            inCode = !inCode
            continue
        }
        if (inCode) continue

        const match = /^(#{2,3})\s+(.*)/.exec(line)
        if (match) {
            const level = match[1].length as 2 | 3
            const text = match[2].trim()
            const id = slugger.slug(text)
            headings.push({ id, text, level })
        }
    }

    return headings
}

type ParamsPromise = Promise<{ slug?: string[] }>

function getPrevNext(path: string) {
    const idx = docLinks.findIndex((d) => d.href === path)
    if (idx === -1) return { prev: null, next: null }
    return {
        prev: idx > 0 ? docLinks[idx - 1] : null,
        next: idx < docLinks.length - 1 ? docLinks[idx + 1] : null,
    }
}

function formatUpdated(date: Date | null | undefined) {
    if (!date) return 'Recently updated'
    return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export async function generateMetadata({ params }: { params: ParamsPromise }): Promise<Metadata> {
    const resolved = await params
    const slugSegments = resolved.slug ?? []
    const resolvedSlug = inferCategoryAndSlug(slugSegments)
    if (!resolvedSlug) notFound()

    const doc = await getDocByCategorySlug(resolvedSlug.category, resolvedSlug.slug, true)
    if (!doc) notFound()

    return {
        title: `${doc.title} | Emberly`,
        description: doc.excerpt ?? undefined,
    }
}

export default async function DocsSlugPage({ params }: { params: ParamsPromise }) {
    const resolved = await params
    const slugSegments = resolved.slug ?? []
    const resolvedSlug = inferCategoryAndSlug(slugSegments)
    if (!resolvedSlug) notFound()

    const doc = await getDocByCategorySlug(resolvedSlug.category, resolvedSlug.slug, true)
    if (!doc) notFound()

    const allDocs = await listDocs({ publishedOnly: true, limit: 200 })
    const sectionLinks = allDocs
        .filter((d) => d.category === resolvedSlug.category)
        .map((d) => {
            const href = resolvedSlug.category === 'HOSTING'
                ? `/docs/hosting/${d.slug}`
                : resolvedSlug.category === 'USERS'
                    ? (d.slug === 'index' || d.slug === 'user' ? '/docs/user' : `/docs/user/${d.slug}`)
                    : resolvedSlug.category === 'INTEGRATIONS'
                        ? (d.slug === 'index' ? '/docs/integrations' : `/docs/integrations/${d.slug}`)
                        : d.slug === 'index'
                            ? '/docs'
                            : `/docs/${d.slug}`
            return { href, label: d.title }
        })
        .sort((a, b) => a.label.localeCompare(b.label))

    const currentPath = `/docs/${slugSegments.join('/')}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/docs'
    const { prev, next } = getPrevNext(currentPath)
    const headings = extractHeadings(doc.content)

    return (
        <PageShell title={doc.title} subtitle={doc.excerpt ?? ''} bodyVariant="plain">
            <section className="mx-auto px-4">
                <div className="mt-6 lg:grid lg:grid-cols-[240px,1fr] gap-10">
                    <div>
                        <DocsToc headings={headings} secondaryLinks={sectionLinks.length ? sectionLinks : docLinks} />
                    </div>

                    <div className="space-y-8">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>Last updated {formatUpdated(doc.updatedAt)}</span>
                        </div>
                        <article className="prose prose-invert max-w-none">
                            <MarkdownRenderer>{doc.content}</MarkdownRenderer>
                        </article>

                        {(prev || next) && (
                            <div className="flex items-center justify-between border-t border-border/50 pt-4 text-sm">
                                <div>
                                    {prev ? (
                                        <a href={prev.href} className="text-muted-foreground hover:text-primary transition-colors">← {prev.label}</a>
                                    ) : <span />}
                                </div>
                                <div>
                                    {next ? (
                                        <a href={next.href} className="text-muted-foreground hover:text-primary transition-colors">{next.label} →</a>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </PageShell>
    )
}
