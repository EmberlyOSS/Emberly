"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ExternalLink } from 'lucide-react'

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

    if (!releases) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-48" />
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-md border border-white/6 bg-white/2 p-4">
                            <Skeleton className="h-5 w-48" />
                            <div className="mt-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4 mt-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const toggle = (id: number) => setExpanded((s) => ({ ...s, [id]: !s[id] }))

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-white/6 bg-white/2 p-4 flex items-center gap-4">
                <Input placeholder="Search releases, descriptions, repos" value={q} onChange={(e: any) => setQ(e.target.value)} className="flex-1" />
                <select value={repoFilter} onChange={(e) => setRepoFilter(e.target.value)} className="rounded border border-input bg-transparent px-3 py-2 text-sm">
                    <option value="all">All repos</option>
                    {repos.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <Button variant="outline" size="sm" onClick={() => { setQ(''); setRepoFilter('all') }}>Reset</Button>
            </div>

            <div className="rounded-md border border-white/6 overflow-hidden bg-transparent">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Repo / Release</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(rel => (
                            <React.Fragment key={rel.id}>
                                <TableRow className="align-top">
                                    <TableCell className="font-medium max-w-[400px]">
                                        <div className="text-sm text-muted-foreground">{rel.repo}</div>
                                        <div className="flex items-center gap-3">
                                            <a href={rel.htmlUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{rel.name}</a>
                                            <div className="text-sm text-muted-foreground">{rel.tagName}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">{new Date(rel.publishedAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={rel.htmlUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => toggle(rel.id)}>
                                                <ChevronDown className={`h-4 w-4 transition-transform ${expanded[rel.id] ? 'rotate-180' : ''}`} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {expanded[rel.id] && (
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            <div className="p-4 border-t bg-white/3 rounded-b-md">
                                                <div className="prose max-w-none text-sm">
                                                    <ReactMarkdown>{rel.body}</ReactMarkdown>
                                                </div>
                                                {rel.author && (
                                                    <div className="mt-3 flex items-center justify-end gap-2 text-sm text-muted-foreground">
                                                        <div>{rel.author.login}</div>
                                                        {rel.author.avatar && <img src={rel.author.avatar} className="w-8 h-8 rounded-full" alt={rel.author.login} />}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground p-6">No releases found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
