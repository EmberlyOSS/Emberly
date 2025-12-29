"use client"

import { useEffect, useState } from 'react'
import { Edit2, Scale, Trash2 } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import { Skeleton } from '@/packages/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/packages/components/ui/table'
import { useToast } from '@/packages/hooks/use-toast'

export type LegalRecord = {
    id: string
    title: string
    slug: string
    status: string
    publishedAt?: string | null
    sortOrder?: number | null
    excerpt?: string | null
    content?: string
}

function LegalTableSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Title</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Slug</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                        <TableHead className="text-right text-muted-foreground font-medium">Sort</TableHead>
                        <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(3)].map((_, i) => (
                        <TableRow key={i} className="border-border/50">
                            <TableCell>
                                <Skeleton className="h-4 w-[220px]" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-[120px]" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-4 w-12 ml-auto" />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'PUBLISHED':
            return <Badge className="bg-chart-2/20 text-chart-2 hover:bg-chart-2/30 border-0">Published</Badge>
        case 'DRAFT':
            return <Badge variant="secondary" className="bg-muted/50">Draft</Badge>
        case 'ARCHIVED':
            return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
        default:
            return <Badge variant="secondary">{status}</Badge>
    }
}

export function LegalList({ onEdit }: { onEdit?: (id: string) => void }) {
    const { toast } = useToast()
    const [pages, setPages] = useState<LegalRecord[]>([])
    const [loading, setLoading] = useState(false)

    async function load() {
        setLoading(true)
        try {
            const res = await fetch('/api/legal?all=true&limit=200', {
                credentials: 'include',
            })
            const json = await res.json()
            setPages(json.data || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    async function handleDelete(id: string) {
        if (!confirm('Delete this legal page?')) return
        try {
            const res = await fetch(`/api/legal/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            if (!res.ok) throw new Error('Delete failed')
            toast({
                title: 'Legal page deleted',
                description: 'The legal page has been deleted successfully.',
            })
            await load()
        } catch (e) {
            toast({
                title: 'Error',
                description: String(e),
                variant: 'destructive',
            })
        }
    }

    if (loading) return <LegalTableSkeleton />
    if (!loading && pages.length === 0) {
        return (
            <div className="rounded-xl border border-border/50 border-dashed bg-background/30 p-12 text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Scale className="h-7 w-7 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-medium mb-2">No legal pages yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    Create legal pages like Terms of Service and Privacy Policy.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Title</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Slug</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                        <TableHead className="text-right text-muted-foreground font-medium">Sort</TableHead>
                        <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pages.map((page) => (
                        <TableRow key={page.id} className="border-border/50 group">
                            <TableCell className="font-medium max-w-[350px]">
                                <div className="truncate">{page.title}</div>
                                {page.excerpt && (
                                    <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                        {page.excerpt}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">{page.slug}</TableCell>
                            <TableCell>{getStatusBadge(page.status)}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                                {page.sortOrder ?? '—'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(page.id)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default LegalList
