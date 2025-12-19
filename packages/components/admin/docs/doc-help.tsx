export default function DocHelp() {
    return (
        <div className="rounded-2xl bg-background/10 border border-border/20 p-4">
            <h4 className="text-lg font-semibold mb-2">Docs Admin Tips</h4>
            <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                <li>Select a <strong>Category</strong> to decide where the page renders (hosting, users, or main docs index).</li>
                <li>Use a URL-safe <em>Slug</em>; combined with category it must be unique.</li>
                <li>Write content in Markdown. Keep an <em>Excerpt</em> short for listings.</li>
                <li>Set <strong>Status</strong> to <em>Published</em> to make the page live. Drafts stay hidden.</li>
                <li>Optionally set <strong>Sort order</strong> and <strong>Published at</strong> for ordering.</li>
            </ol>

            <hr className="my-3 border-border/30" />

            <h5 className="text-sm font-semibold">Notes</h5>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                <li>Docs are stored in the database; fallbacks may use the legacy markdown files.</li>
                <li>Status respects publication on the public /docs pages.</li>
            </ul>
        </div>
    )
}
