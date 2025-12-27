"use client"

import { HelpCircle } from 'lucide-react'

export default function LegalHelp() {
    return (
        <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/10">
                    <HelpCircle className="h-4 w-4 text-chart-1" />
                </div>
                <h4 className="font-semibold">Tips</h4>
            </div>
            <div className="p-4">
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    <li>Use clear slugs like <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono">terms</code>, <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono">privacy</code>, or <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono">gdpr</code>. Slugs become the URL path under /legal.</li>
                    <li>Draft status keeps the page hidden; publish to make it live. Archived keeps the record but is excluded from public routes.</li>
                    <li>Optional sort order controls table ordering in the public legal hub.</li>
                    <li>Write content in Markdown. Consider including last updated dates inside the content when needed.</li>
                </ul>
            </div>
        </div>
    )
}
