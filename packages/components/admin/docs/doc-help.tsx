import { HelpCircle } from 'lucide-react'

export default function DocHelp() {
    return (
        <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/10">
                    <HelpCircle className="h-4 w-4 text-chart-1" />
                </div>
                <h4 className="font-semibold">Docs Admin Tips</h4>
            </div>
            <div className="p-4 space-y-4">
                <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                    <li>Select a <strong className="text-foreground">Category</strong> to decide where the page renders (hosting, users, or main docs index).</li>
                    <li>Use a URL-safe <em>Slug</em>; combined with category it must be unique.</li>
                    <li>Write content in Markdown. Keep an <em>Excerpt</em> short for listings.</li>
                    <li>Set <strong className="text-foreground">Status</strong> to <em>Published</em> to make the page live. Drafts stay hidden.</li>
                    <li>Optionally set <strong className="text-foreground">Sort order</strong> and <strong className="text-foreground">Published at</strong> for ordering.</li>
                </ol>

                <hr className="border-border/50" />

                <div>
                    <h5 className="text-sm font-semibold mb-2">Notes</h5>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Docs are stored in the database; fallbacks may use the legacy markdown files.</li>
                        <li>Status respects publication on the public /docs pages.</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
