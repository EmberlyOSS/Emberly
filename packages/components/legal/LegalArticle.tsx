import Link from 'next/link'
import { ArrowLeft, Calendar, Scale, FileText, BookOpen, ExternalLink, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'
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
            <section className="mx-auto px-4 max-w-5xl">
                {/* Back button */}
                <div className="mb-6">
                    <Link href={backHref}>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            {backLabel}
                        </Button>
                    </Link>
                </div>

                <div className="lg:grid lg:grid-cols-[1fr,280px] gap-8">
                    {/* Main content */}
                    <div className="space-y-6">
                        {/* Document header card */}
                        <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                            <div className="relative p-6">
                                <div className="flex flex-wrap items-center gap-4">
                                    {/* Icon */}
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Scale className="h-6 w-6 text-primary" />
                                    </div>
                                    
                                    {/* Meta info */}
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatUpdated(updatedAt)}</span>
                                            {relativeTime && (
                                                <span className="text-muted-foreground/60">
                                                    ({relativeTime})
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="h-4 w-4" />
                                            <span>Legal Document</span>
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
                                    <MarkdownRenderer>{content}</MarkdownRenderer>
                                </article>
                            </div>
                        </div>

                        {/* Footer card */}
                        <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                            <div className="relative p-6">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-center sm:text-left">
                                        <p className="font-medium">Questions about this document?</p>
                                        <p className="text-sm text-muted-foreground">Contact our support team for clarification.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link href="/contact">
                                            <Button variant="outline" className="bg-white/5 dark:bg-white/[0.02] border-white/10 dark:border-white/5 hover:bg-white/10">
                                                Contact us
                                            </Button>
                                        </Link>
                                        <Link href={backHref}>
                                            <Button variant="outline" className="bg-white/5 dark:bg-white/[0.02] border-white/10 dark:border-white/5 hover:bg-white/10">
                                                View all docs
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 space-y-6">
                            {/* Document info */}
                            <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                                <div className="relative p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <BookOpen className="h-4 w-4 text-primary" />
                                        </div>
                                        <h3 className="font-semibold">Document Info</h3>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Type</span>
                                            <span className="font-medium">Legal</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Updated</span>
                                            <span className="font-medium">{formatUpdated(updatedAt)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Jurisdiction</span>
                                            <span className="font-medium">Canada (BC)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick links */}
                            <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                                <div className="relative p-5">
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Related</h4>
                                    <ul className="space-y-3">
                                        <li>
                                            <Link 
                                                href="/legal" 
                                                className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                                            >
                                                <Scale className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span>Legal Hub</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link 
                                                href="/contact" 
                                                className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                                            >
                                                <MessageCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span>Contact Support</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link 
                                                href="/discord" 
                                                className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                                            >
                                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span>Discord</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </PageShell>
    )
}
