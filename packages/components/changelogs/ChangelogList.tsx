"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Input } from '@/packages/components/ui/input'
import { getRelativeTime } from '@/packages/lib/utils'
import { Button } from '@/packages/components/ui/button'
import { Skeleton } from '@/packages/components/ui/skeleton'
import { Badge } from '@/packages/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/packages/components/ui/select'
import { ChevronDown, ExternalLink, GitBranch, Calendar, Search, Filter, RotateCcw, Tag, User } from 'lucide-react'
import { cn } from '@/packages/lib/utils'

type Release = {
    id: number
    repo: string
    tagName: string
    name: string
    body: string
    htmlUrl: string
    publishedAt: string
    author?: { login: string; avatar?: string }
}

export default function ChangelogList({ org }: { org?: string }) {
    const [releases, setReleases] = useState<Release[] | null>(null)
    const [q, setQ] = useState('')
    const [repoFilter, setRepoFilter] = useState<string>('all')
    const [expanded, setExpanded] = useState<Record<number, boolean>>({})

    useEffect(() => {
        let mounted = true
        const path = org ? `/api/changelogs?org=${encodeURIComponent(org)}` : '/api/changelogs'
        fetch(path).then(async (r) => {
            const j = await r.json()
            if (!mounted) return
            if (j && j.releases) setReleases(j.releases)
            else setReleases([])
        }).catch(() => { if (mounted) setReleases([]) })
        return () => { mounted = false }
    }, [org])

    const repos = useMemo(() => {
        if (!releases) return []
        const s = Array.from(new Set(releases.map(r => r.repo)))
        return s.sort()
    }, [releases])

    const filtered = useMemo(() => {
        if (!releases) return []
        return releases.filter(r => {
            if (repoFilter !== 'all' && r.repo !== repoFilter) return false
            if (q.trim() === '') return true
            const term = q.toLowerCase()
            return r.name.toLowerCase().includes(term) || r.body.toLowerCase().includes(term) || r.repo.toLowerCase().includes(term)
        })
    }, [releases, q, repoFilter])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }


    if (!releases) {
        return (
            <div className="space-y-6">
                {/* Filter skeleton */}
                <div className="relative rounded-xl bg-background/80 backdrop-blur-lg border border-border/50 p-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                        <Skeleton className="h-10 w-full sm:w-48 rounded-lg" />
                        <Skeleton className="h-10 w-full sm:w-24 rounded-lg" />
                    </div>
                </div>

                {/* Release cards skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="relative rounded-xl bg-background/80 backdrop-blur-lg border border-border/50 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-5 w-32 rounded-full" />
                                    <Skeleton className="h-6 w-64" />
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const toggle = (id: number) => setExpanded((s) => ({ ...s, [id]: !s[id] }))

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="relative rounded-xl bg-background/80 backdrop-blur-lg border border-border/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative p-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search releases, descriptions, repos..."
                                value={q}
                                onChange={(e: any) => setQ(e.target.value)}
                                className="pl-10 bg-background/80 border-border/50 focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div className="relative flex items-center">
                            <Filter className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                            <Select value={repoFilter} onValueChange={setRepoFilter}>
                                <SelectTrigger className="h-10 w-full sm:w-[200px] pl-10 bg-background/80 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-colors">
                                    <SelectValue placeholder="All repositories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All repositories</SelectItem>
                                    {repos.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setQ(''); setRepoFilter('all') }}
                            className="h-10 px-4 bg-background/80 border-border/50 hover:bg-background/90 transition-colors"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results count */}
            {(q || repoFilter !== 'all') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Showing {filtered.length} of {releases.length} releases</span>
                    {repoFilter !== 'all' && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                            {repoFilter}
                        </Badge>
                    )}
                </div>
            )}

            {/* Release cards */}
            <div className="space-y-4">
                {filtered.map(rel => (
                    <div
                        key={rel.id}
                        className="group relative rounded-xl bg-background/80 backdrop-blur-lg border border-border/50 overflow-hidden transition-all duration-200 hover:bg-background/90 hover:border-border"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Main content */}
                        <div className="relative p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0 space-y-2">
                                    {/* Repo badge */}
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="bg-primary/10 hover:bg-primary/15 text-primary border-0 font-medium"
                                        >
                                            <GitBranch className="h-3 w-3 mr-1" />
                                            {rel.repo}
                                        </Badge>
                                    </div>

                                    {/* Release name */}
                                    <h3 className="text-lg font-semibold tracking-tight truncate">
                                        <a
                                            href={rel.htmlUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-primary transition-colors"
                                        >
                                            {rel.name}
                                        </a>
                                    </h3>

                                    {/* Meta info */}
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Tag className="h-3.5 w-3.5" />
                                            <span className="font-mono text-xs">{rel.tagName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{formatDate(rel.publishedAt)}</span>
                                            <span className="text-muted-foreground/60">({getRelativeTime(new Date(rel.publishedAt))})</span>
                                        </div>
                                        {rel.author && (
                                            <div className="flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5" />
                                                <span>{rel.author.login}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                        className="h-9 w-9 rounded-lg bg-background/80 hover:bg-background/90 border border-border/50"
                                    >
                                        <a href={rel.htmlUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggle(rel.id)}
                                        className={cn(
                                            "h-9 w-9 rounded-lg border border-border/50 dark:border-border/20 transition-all",
                                            expanded[rel.id]
                                                ? "bg-primary/10 hover:bg-primary/15 text-primary"
                                                : "bg-background/80 hover:bg-background/90"
                                        )}
                                    >
                                        <ChevronDown className={cn(
                                            "h-4 w-4 transition-transform duration-200",
                                            expanded[rel.id] && "rotate-180"
                                        )} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Expanded content */}
                        {expanded[rel.id] && (
                            <div className="relative border-t border-border/50 dark:border-border/20 animate-in slide-in-from-top-2 fade-in-50 duration-200">
                                <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent dark:from-black/10 pointer-events-none" />
                                <div className="relative p-5">
                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/50 prose-li:text-muted-foreground">
                                        <ReactMarkdown>{rel.body || '*No release notes provided.*'}</ReactMarkdown>
                                    </div>

                                    {rel.author && (
                                        <div className="mt-6 pt-4 border-t border-border/50 dark:border-border/20 flex items-center justify-end gap-3">
                                            <span className="text-sm text-muted-foreground">Released by</span>
                                            <div className="flex items-center gap-2">
                                                {rel.author.avatar && (
                                                    <img
                                                        src={rel.author.avatar}
                                                        className="w-7 h-7 rounded-full ring-2 ring-white/10"
                                                        alt={rel.author.login}
                                                    />
                                                )}
                                                <span className="font-medium text-sm">{rel.author.login}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="relative rounded-xl bg-background/80 backdrop-blur-lg border border-border/50 p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-muted/10 flex items-center justify-center">
                                <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium">No releases found</p>
                                <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setQ(''); setRepoFilter('all') }}
                                className="mt-2"
                            >
                                Clear filters
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
