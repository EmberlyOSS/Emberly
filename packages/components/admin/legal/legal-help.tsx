"use client"

export default function LegalHelp() {
    return (
        <div className="rounded-2xl border border-border/40 bg-background/40 p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Tips</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Use clear slugs like <span className="font-mono">terms</span>, <span className="font-mono">privacy</span>, or <span className="font-mono">gdpr</span>. Slugs become the URL path under /legal.</li>
                <li>Draft status keeps the page hidden; publish to make it live. Archived keeps the record but is excluded from public routes.</li>
                <li>Optional sort order controls table ordering in the public legal hub.</li>
                <li>Write content in Markdown. Consider including last updated dates inside the content when needed.</li>
            </ul>
        </div>
    )
}
