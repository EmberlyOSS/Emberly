"use client"

import React, { useState } from 'react'
import Link from 'next/link'

export default function DocsToc() {
    const [open, setOpen] = useState(false)

    return (
        <div className="lg:hidden mb-4">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="w-full flex items-center justify-between px-4 py-2 bg-background/80 border border-border rounded-md"
            >
                <span className="font-medium">Contents</span>
                <span className="text-sm text-muted-foreground">{open ? 'Hide' : 'Show'}</span>
            </button>

            {open && (
                <nav className="mt-2 space-y-2 bg-background/60 border border-border rounded-md p-3">
                    <Link href="/docs" className="block text-sm font-medium">Overview</Link>
                    <Link href="/docs/getting-started" className="block text-sm">Getting Started</Link>
                    <Link href="/docs/api" className="block text-sm">API Reference</Link>
                    <Link href="/docs/user" className="block text-sm">User Guide</Link>
                    <Link href="/docs/custom-domains" className="block text-sm">Custom Domains</Link>
                </nav>
            )}
        </div>
    )
}
