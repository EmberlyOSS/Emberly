"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

export type BlogHeading = {
    id: string
    text: string
    level: 2 | 3
}

type Props = {
    headings?: BlogHeading[]
}

export default function BlogToc({ headings }: Props) {
    const [open, setOpen] = useState(false)
    const [activeId, setActiveId] = useState<string | null>(null)

    const cardClass = 'rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20'

    const hasHeadings = (headings?.length ?? 0) > 0

    useEffect(() => {
        if (!headings || headings.length === 0) return
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))
                const top = visible[0]
                if (top?.target?.id) setActiveId(top.target.id)
            },
            {
                rootMargin: '-20% 0px -60% 0px',
                threshold: [0.1, 0.25, 0.5],
            }
        )

        headings.forEach((h) => {
            const el = document.getElementById(h.id)
            if (el) observer.observe(el)
        })

        return () => observer.disconnect()
    }, [headings])

    const renderedHeadings = useMemo(() => {
        if (!headings) return null
        return headings.map((h) => {
            const isActive = activeId === h.id
            return (
                <Link
                    key={h.id}
                    href={`#${h.id}`}
                    onClick={() => setOpen(false)}
                    className={`block text-sm transition-colors ${h.level === 3 ? 'pl-4' : ''} ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
                >
                    {h.text}
                </Link>
            )
        })
    }, [headings, activeId])

    if (!hasHeadings) return null

    return (
        <div className="space-y-4">
            {/* Mobile toggle */}
            <div className="lg:hidden">
                <div className={`${cardClass} p-4 space-y-3`}>
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        aria-expanded={open}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-background/60 border border-white/10 text-sm font-medium"
                    >
                        <span>On this page</span>
                        <span className="text-xs text-muted-foreground">{open ? 'Hide' : 'Show'}</span>
                    </button>

                    {open && (
                        <nav className="space-y-3">
                            <div className="pt-2 border-t border-white/10 space-y-1">
                                {renderedHeadings}
                            </div>
                        </nav>
                    )}
                </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
                <div className={`${cardClass} p-4 space-y-2 pr-3`}>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">On this page</div>
                    <nav className="space-y-1">{renderedHeadings}</nav>
                </div>
            </aside>
        </div>
    )
}
