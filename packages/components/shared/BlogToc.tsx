"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, List } from 'lucide-react'
import { cn } from '@/packages/lib/utils'

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
                    className={cn(
                        "block text-sm py-1.5 transition-all duration-150 border-l-2 -ml-px",
                        h.level === 3 ? 'pl-5' : 'pl-3',
                        isActive
                            ? 'text-primary font-medium border-primary bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border/30'
                    )}
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
                <div className="glass-card overflow-hidden">
                    <div className="relative p-4 space-y-3">
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80 border border-border/50 text-sm font-medium hover:bg-background/90 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <List className="h-4 w-4 text-muted-foreground" />
                                <span>On this page</span>
                            </div>
                            <ChevronDown className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                open && "rotate-180"
                            )} />
                        </button>

                        {open && (
                            <nav className="animate-in slide-in-from-top-2 fade-in-50 duration-200">
                                <div className="pt-2 border-t border-l border-border/50 space-y-0.5 ml-2">
                                    {renderedHeadings}
                                </div>
                            </nav>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
                <div className="glass-card overflow-hidden">
                    <div className="relative p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium mb-3">
                            <List className="h-3.5 w-3.5" />
                            <span>On this page</span>
                        </div>
                        <nav className="space-y-0.5 border-l border-border/50">
                            {renderedHeadings}
                        </nav>
                    </div>
                </div>
            </aside>
        </div>
    )
}
