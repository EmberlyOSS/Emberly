import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import GithubSlugger from 'github-slugger'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, ArrowRight, Calendar, FileText, BookOpen } from 'lucide-react'

import DocsToc from '@/packages/components/docs/DocsToc'
import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'
import { docLinks } from '@/packages/components/docs/nav-links'
import PageShell from '@/packages/components/layout/PageShell'
import { Button } from '@/packages/components/ui/button'
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
    return date.toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function getRelativeTime(date: Date | null | undefined) {
    if (!date) return null
    return formatDistanceToNow(date, { addSuffix: true })
}

export async function generateMetadata({ params }: { params: ParamsPromise }): Promise<Metadata> {
    const resolved = await params
    const slugSegments = resolved.slug ?? []
    const resolvedSlug = inferCategoryAndSlug(slugSegments)
    if (!resolvedSlug) notFound()

    const doc = await getDocByCategorySlug(resolvedSlug.category, resolvedSlug.slug, true)
    if (!doc) notFound()

    return {
        title: doc.title,
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

    const relativeTime = getRelativeTime(doc.updatedAt)

    return (
        <PageShell title={doc.title} subtitle={doc.excerpt ?? ''} bodyVariant="plain">
            <section className="mx-auto px-4 max-w-7xl">
                {/* Back button */}
                <div className="mb-6">
                    <Link href="/docs">
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to docs
                        </Button>
                    </Link>
                </div>

                <div className="lg:grid lg:grid-cols-[260px,1fr] gap-8">
                    {/* Sidebar with TOC */}
                    <div>
                        <DocsToc headings={headings} secondaryLinks={sectionLinks.length ? sectionLinks : docLinks} />
                    </div>

                    {/* Main content */}
                    <div className="space-y-6">
                        {/* Document header card */}
                        <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                            <div className="relative p-6">
                                <div className="flex flex-wrap items-center gap-4">
                                    {/* Icon */}
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-primary" />
                                    </div>

                                    {/* Meta info */}
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatUpdated(doc.updatedAt)}</span>
                                            {relativeTime && (
                                                <span className="text-muted-foreground/60">
                                                    ({relativeTime})
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="h-4 w-4" />
                                            <span>Documentation</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Article body */}
                        <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                            <div className="relative p-6 sm:p-8">
                                <article className="prose prose-sm sm:prose dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-li:text-muted-foreground prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground prose-hr:border-white/10 prose-ul:text-muted-foreground prose-ol:text-muted-foreground">
                                    <MarkdownRenderer>{doc.content}</MarkdownRenderer>
                                </article>
                            </div>
                        </div>

                        {/* Prev/Next navigation */}
                        {(prev || next) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {prev ? (
                                    <Link href={prev.href} className="group">
                                        <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden p-4 transition-all duration-200 hover:bg-white/[0.07] dark:hover:bg-white/[0.04] hover:border-white/15">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative flex items-center gap-3">
                                                <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Previous</div>
                                                    <div className="font-medium group-hover:text-primary transition-colors">{prev.label}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ) : <div />}
                                {next ? (
                                    <Link href={next.href} className="group">
                                        <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden p-4 transition-all duration-200 hover:bg-white/[0.07] dark:hover:bg-white/[0.04] hover:border-white/15">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative flex items-center justify-end gap-3 text-right">
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Next</div>
                                                    <div className="font-medium group-hover:text-primary transition-colors">{next.label}</div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    </Link>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </PageShell>
    )
}
