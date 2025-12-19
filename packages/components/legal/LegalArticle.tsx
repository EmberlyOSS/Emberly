import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'
import PageShell from '@/packages/components/layout/PageShell'

function formatUpdated(date?: Date | null) {
    if (!date) return 'Recently updated'
    return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
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
    return (
        <PageShell title={title} subtitle={subtitle ?? ''} bodyVariant="plain">
            <section className="mx-auto px-4 space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>Last updated {formatUpdated(updatedAt ?? null)}</span>
                </div>
                <article className="prose prose-invert max-w-none text-sm">
                    <MarkdownRenderer>{content}</MarkdownRenderer>
                </article>
                {backHref ? (
                    <div className="pt-2">
                        <a href={backHref} className="text-sm underline text-muted-foreground hover:text-primary transition-colors">
                            {backLabel}
                        </a>
                    </div>
                ) : null}
            </section>
        </PageShell>
    )
}
