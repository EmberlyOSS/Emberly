'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock3, Search, FileText, ArrowRight, Filter, RotateCcw, BookOpen } from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
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

const categoryColors: Record<string, string> = {
    MAIN: 'bg-blue-500/20 text-blue-400',
    HOSTING: 'bg-purple-500/20 text-purple-400',
    USERS: 'bg-green-500/20 text-green-400',
    INTEGRATIONS: 'bg-orange-500/20 text-orange-400',
}

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
            <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted/10 flex items-center justify-center">
                        <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-medium">No documentation found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
                    </div>
                </div>
            </div>
        )
    }

    const start = (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, total)

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
                {docs.map((doc) => (
                    <Link key={doc.id} href={doc.href} className="block group">
                        <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden transition-all duration-200 hover:bg-white/[0.07] dark:hover:bg-white/[0.04] hover:border-white/15 dark:hover:border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0 space-y-2">
                                        {/* Category badge */}
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "border-0 font-medium text-xs",
                                                categoryColors[doc.category] || 'bg-primary/20 text-primary'
                                            )}
                                        >
                                            <BookOpen className="h-3 w-3 mr-1" />
                                            {doc.category}
                                        </Badge>

                                        {/* Title */}
                                        <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                                            {doc.title}
                                        </h3>

                                        {/* Description */}
                                        {doc.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {doc.description}
                                            </p>
                                        )}

                                        {/* Meta */}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            <span>Updated {formatUpdatedAt(doc.updatedAt)}</span>
                                        </div>
                                    </div>

                                    {/* Read indicator */}
                                    <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <span>Read</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {total > pageSize ? (
                <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
                        <span>
                            Showing {start}–{end} of {total} documents
                        </span>
                        <Pagination className="justify-end sm:justify-start">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        className={cn(
                                            "bg-white/5 dark:bg-white/[0.02] border-white/10 dark:border-white/5 hover:bg-white/10",
                                            page <= 1 && 'pointer-events-none opacity-50'
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            if (page > 1) onPrev()
                                        }}
                                    />
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="text-xs text-muted-foreground px-2">
                                        Page {page} of {pageCount}
                                    </span>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        className={cn(
                                            "bg-white/5 dark:bg-white/[0.02] border-white/10 dark:border-white/5 hover:bg-white/10",
                                            page >= pageCount && 'pointer-events-none opacity-50'
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            if (page < pageCount) onNext()
                                        }}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
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
            <div className="space-y-6">
                <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 p-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search documentation..."
                            className="pl-10 bg-white/5 dark:bg-white/[0.02] border-white/10 dark:border-white/5 focus:border-primary/50"
                            type="search"
                        />
                    </div>
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
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value)} className="space-y-6">
            {/* Filters */}
            <div className="relative rounded-xl bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 dark:border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="w-full md:w-auto overflow-x-auto scrollbar-none -mx-1 px-1">
                            <TabsList className="p-1 bg-white/5 dark:bg-white/[0.02] border border-white/10 dark:border-white/5 rounded-lg inline-flex w-max min-w-full sm:min-w-0">
                                {categories.map((category) => (
                                    <TabsTrigger
                                        className="text-xs sm:text-sm px-3 sm:px-4 py-2 hover:text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm whitespace-nowrap rounded-md transition-all"
                                        key={category.value}
                                        value={category.value}
                                    >
                                        {category.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search documentation..."
                                className="pl-10 bg-white/5 dark:bg-white/[0.02] border-white/10 dark:border-white/5 focus:border-primary/50 transition-colors"
                                type="search"
                            />
                        </div>
                    </div>
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
