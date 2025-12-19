'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock3, Search } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/packages/components/ui/pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
import { cn } from '@/packages/lib/utils'

export type DocsBrowserDoc = {
    id: string
    title: string
    description?: string | null
    category: string
    href: string
    updatedAt?: string | null
    authorName?: string | null
}

type Props = {
    docs: DocsBrowserDoc[]
    bodyVariant?: 'card' | 'plain'
    pageSize?: number
}

type CategoryFilter = {
    value: string
    label: string
}

const categories: CategoryFilter[] = [
    { value: 'ALL', label: 'All' },
    { value: 'MAIN', label: 'Main' },
    { value: 'HOSTING', label: 'Hosting' },
    { value: 'USERS', label: 'Users' },
    { value: 'INTEGRATIONS', label: 'Integrations' },
]

function formatUpdatedAt(value?: string | null) {
    if (!value) return 'Updated just now'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Updated recently'
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

function docMatchesQuery(doc: DocsBrowserDoc, normalizedQuery: string) {
    if (!normalizedQuery) return true
    return (
        doc.title.toLowerCase().includes(normalizedQuery) ||
        (doc.description || '').toLowerCase().includes(normalizedQuery)
    )
}

function categoryMatches(doc: DocsBrowserDoc, category: string) {
    if (category === 'ALL') return true
    return doc.category === category
}

function filterDocs(docs: DocsBrowserDoc[], normalizedQuery: string, category: string) {
    return docs.filter((doc) => categoryMatches(doc, category) && docMatchesQuery(doc, normalizedQuery))
}

type DocsListProps = {
    docs: DocsBrowserDoc[]
    total: number
    page: number
    pageCount: number
    pageSize: number
    onPrev: () => void
    onNext: () => void
}

function DocsList({ docs, total, page, pageCount, pageSize, onPrev, onNext }: DocsListProps) {
    if (docs.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-sm text-muted-foreground">
                No documentation found for this filter.
            </div>
        )
    }

    const start = (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, total)

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
                {docs.map((doc) => (
                    <div
                        key={doc.id}
                        className="rounded-xl border border-border/50 bg-background/50 p-4 shadow-sm transition hover:border-primary/50"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <Link href={doc.href} className="text-lg font-semibold hover:underline">
                                    {doc.title}
                                </Link>
                                {doc.description ? (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>
                                ) : null}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock3 className="h-4 w-4" />
                                    <span>Last updated {formatUpdatedAt(doc.updatedAt)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 text-right">
                                <span className="rounded-full border border-border/60 bg-primary/60 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
                                    {doc.category}
                                </span>
                                <Button asChild size="sm" variant="outline">
                                    <Link href={doc.href}>Read</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {total > pageSize ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
                    <span>
                        Showing {start}–{end} of {total}
                    </span>
                    <Pagination className="justify-end sm:justify-start">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    className={cn(page <= 1 && 'pointer-events-none opacity-50')}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        if (page > 1) onPrev()
                                    }}
                                />
                            </PaginationItem>
                            <PaginationItem>
                                <span className="text-xs text-muted-foreground">
                                    Page {page} of {pageCount}
                                </span>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    className={cn(page >= pageCount && 'pointer-events-none opacity-50')}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        if (page < pageCount) onNext()
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            ) : null}
        </div>
    )
}

export default function DocsBrowser({ docs, bodyVariant = 'card', pageSize = 10 }: Props) {
    const [query, setQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState<string>(categories[0].value)
    const [page, setPage] = useState(1)

    useEffect(() => {
        setPage(1)
    }, [query, activeCategory])

    const normalizedQuery = query.trim().toLowerCase()
    const filteredDocs = useMemo(
        () => filterDocs(docs, normalizedQuery, activeCategory),
        [docs, normalizedQuery, activeCategory]
    )
    const pageCount = Math.max(1, Math.ceil(filteredDocs.length / pageSize))
    const safePage = Math.min(page, pageCount)
    const paginated = filteredDocs.slice((safePage - 1) * pageSize, safePage * pageSize)

    if (bodyVariant !== 'card') {
        return (
            <div className="space-y-4">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search docs"
                        className="pl-8"
                        type="search"
                    />
                </div>
                <DocsList
                    docs={paginated}
                    total={filteredDocs.length}
                    page={safePage}
                    pageCount={pageCount}
                    pageSize={pageSize}
                    onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
                    onNext={() => setPage((prev) => Math.min(prev + 1, pageCount))}
                />
            </div>
        )
    }

    return (
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value)} className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <TabsList className="p-4 bg-background/50 border border-border/50 rounded-xl shadow-sm">
                    {categories.map((category) => (
                        <TabsTrigger
                            className="hover:text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                            key={category.value}
                            value={category.value}
                        >
                            {category.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search docs"
                        className="pl-8"
                        type="search"
                    />
                </div>
            </div>

            {categories.map((category) => {
                const filteredByTab = filterDocs(docs, normalizedQuery, category.value)
                const tabPageCount = Math.max(1, Math.ceil(filteredByTab.length / pageSize))
                const tabPage = Math.min(page, tabPageCount)
                const tabDocs = filteredByTab.slice((tabPage - 1) * pageSize, tabPage * pageSize)

                return (
                    <TabsContent key={category.value} value={category.value}>
                        <DocsList
                            docs={tabDocs}
                            total={filteredByTab.length}
                            page={tabPage}
                            pageCount={tabPageCount}
                            pageSize={pageSize}
                            onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
                            onNext={() => setPage((prev) => Math.min(prev + 1, tabPageCount))}
                        />
                    </TabsContent>
                )
            })}
        </Tabs>
    )
}
