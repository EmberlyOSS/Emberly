"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, List, FileText } from 'lucide-react'
import { cn } from '@/packages/lib/utils'

import { docLinks } from './nav-links'

type Heading = {
    id: string
    text: string
    level: 2 | 3
}

type Props = {
    headings?: Heading[]
    secondaryLinks?: { href: string; label: string }[]
}

export default function DocsToc({ headings, secondaryLinks }: Props) {
    const pathname = usePathname()
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
                            : 'text-muted-foreground hover:text-foreground border-transparent hover:border-white/20'
                    )}
                >
                    {h.text}
                </Link>
            )
        })
    }, [headings, activeId])

    const links = secondaryLinks && secondaryLinks.length ? secondaryLinks : docLinks

    return (
        <div className="space-y-4 mb-6 lg:mb-0">
            {/* Mobile toggle */}
            <div className="lg:hidden">
                <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                    <div className="relative p-4 space-y-3">
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 dark:bg-white/[0.02] border border-white/10 dark:border-white/5 text-sm font-medium hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <List className="h-4 w-4 text-muted-foreground" />
                                <span>Navigation</span>
                            </div>
                            <ChevronDown className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                open && "rotate-180"
                            )} />
                        </button>

                        {open && (
                            <nav className="space-y-4 animate-in slide-in-from-top-2 fade-in-50 duration-200">
                                <div className="space-y-1 border-l border-white/10 ml-2">
                                    {links.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                "block text-sm py-1.5 pl-3 border-l-2 -ml-px transition-all duration-150",
                                                pathname === link.href
                                                    ? 'text-primary font-medium border-primary bg-primary/5'
                                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-white/20'
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                                {hasHeadings && (
                                    <div className="pt-3 border-t border-white/10 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2 ml-2">
                                            <FileText className="h-3.5 w-3.5" />
                                            <span>On this page</span>
                                        </div>
                                        <div className="space-y-0.5 border-l border-white/10 ml-2">
                                            {renderedHeadings}
                                        </div>
                                    </div>
                                )}
                            </nav>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
                <div className="space-y-4">
                    {/* Docs navigation */}
                    <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                        <div className="relative p-4">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium mb-3">
                                <List className="h-3.5 w-3.5" />
                                <span>Documentation</span>
                            </div>
                            <nav className="space-y-0.5 border-l border-white/10 dark:border-white/5">
                                {links.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "block text-sm py-1.5 pl-3 border-l-2 -ml-px transition-all duration-150",
                                            pathname === link.href
                                                ? 'text-primary font-medium border-primary bg-primary/5'
                                                : 'text-muted-foreground hover:text-foreground border-transparent hover:border-white/20'
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* On this page */}
                    {hasHeadings && (
                        <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                            <div className="relative p-4">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium mb-3">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>On this page</span>
                                </div>
                                <nav className="space-y-0.5 border-l border-white/10 dark:border-white/5">
                                    {renderedHeadings}
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    )
}
