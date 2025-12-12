import React from 'react'
import Link from 'next/link'
import DocsToc from '@/components/docs/DocsToc'

export const metadata = {
    title: 'Documentation | Emberly',
    description: 'Guides, API reference, and examples to help you get started with Emberly.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <header className="bg-gradient-to-r from-primary/6 to-accent/6 border-b border-border/30">
                <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                    <div className="max-w-4xl">
                        <h1 className="text-2xl md:text-3xl font-extrabold">Documentation</h1>
                        <p className="mt-2 text-muted-foreground max-w-2xl">
                            Guides, API reference, and examples to help you get started with Emberly.
                        </p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 md:px-6 py-6 md:py-10">
                {/* Mobile TOC (collapsible) */}
                <DocsToc />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="hidden lg:block">
                        <nav className="space-y-2 sticky top-20">
                            <Link href="/docs" className="block text-sm font-medium">Overview</Link>
                            <Link href="/docs/getting-started" className="block text-sm">Getting Started</Link>
                            <Link href="/docs/api" className="block text-sm">API Reference</Link>
                            <Link href="/docs/user" className="block text-sm">User Guide</Link>
                            <Link href="/docs/custom-domains" className="block text-sm">Custom Domains</Link>
                        </nav>
                    </aside>

                    <section className="lg:col-span-3 space-y-6">{children}</section>
                </div>
            </main>
        </div>
    )
}
