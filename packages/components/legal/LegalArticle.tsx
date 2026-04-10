import Link from 'next/link'
import { ArrowLeft, Calendar, Scale, BookOpen, ExternalLink, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import MarkdownRenderer from '@/packages/components/shared/MarkdownRenderer'
import PageShell from '@/packages/components/layout/PageShell'
import { Button } from '@/packages/components/ui/button'

function formatUpdated(date?: Date | null) {
    if (!date) return 'Recently updated'
    return date.toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function getRelativeTime(date?: Date | null) {
    if (!date) return null
    return formatDistanceToNow(date, { addSuffix: true })
}

interface Props {
    title: string
    subtitle?: string
    content: string
    updatedAt?: Date | null
    backHref?: string
    backLabel?: string
}

export default function LegalArticle({
    title,
    subtitle,
    content,
    updatedAt,
    backHref = '/legal',
    backLabel = 'Back to Legal Hub',
}: Props) {
    const relativeTime = getRelativeTime(updatedAt)

    return (
        <PageShell title={title} subtitle={subtitle ?? ''} bodyVariant="plain">
            <section className="w-full">
                {/* Back button */}
                <div className="mb-6">
                    <Link href={backHref}>
                        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            {backLabel}
                        </Button>
                    </Link>
                </div>

                <div className="lg:grid lg:grid-cols-[1fr,260px] gap-12">
                    {/* Main content */}
                    <div className="min-w-0 space-y-4">
                        {/* Inline meta strip */}
                        <div className="glass-subtle rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Scale className="h-3.5 w-3.5 text-primary" />
                                <span>Legal Document</span>
                            </div>
                            <span className="text-border/60 select-none">·</span>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatUpdated(updatedAt)}</span>
                                {relativeTime && (
                                    <span className="text-muted-foreground/50">({relativeTime})</span>
                                )}
                            </div>
                        </div>

                        {/* Article body */}
                        <div className="glass-subtle rounded-xl p-6 sm:p-10">
                            <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-headings:scroll-mt-24 prose-p:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/50 prose-li:text-muted-foreground prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-hr:border-border/40 prose-ul:text-muted-foreground prose-ol:text-muted-foreground">
                                <MarkdownRenderer>{content}</MarkdownRenderer>
                            </article>
                        </div>

                        {/* Footer CTA */}
                        <div className="glass-subtle rounded-xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="font-medium">Questions about this document?</p>
                                <p className="text-sm text-muted-foreground">Our support team is happy to clarify anything.</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/contact">Contact us</Link>
                                </Button>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={backHref}>View all docs</Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 space-y-4">
                            {/* Document info */}
                            <div className="glass-subtle rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-sm">Document Info</h3>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium">Legal</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground shrink-0">Updated</span>
                                        <span className="font-medium text-right">{formatUpdated(updatedAt)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Jurisdiction</span>
                                        <span className="font-medium">Canada (BC)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Related links */}
                            <div className="glass-subtle rounded-xl p-5">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Related</h4>
                                <ul className="space-y-2">
                                    <li>
                                        <Link
                                            href="/legal"
                                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                                        >
                                            <Scale className="h-3.5 w-3.5 shrink-0 group-hover:text-primary transition-colors" />
                                            <span>Legal Hub</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/contact"
                                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                                        >
                                            <MessageCircle className="h-3.5 w-3.5 shrink-0 group-hover:text-primary transition-colors" />
                                            <span>Contact Support</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/discord"
                                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5 shrink-0 group-hover:text-primary transition-colors" />
                                            <span>Discord</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </PageShell>
    )
}
