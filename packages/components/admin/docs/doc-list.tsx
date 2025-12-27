"use client"

import { useEffect, useState } from 'react'
import { BookOpen, Edit2, Trash2 } from 'lucide-react'

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

export type DocRecord = {
    id: string
    title: string
    slug: string
    category: string
    status: string
    publishedAt?: string | null
    sortOrder?: number | null
    excerpt?: string | null
    content?: string
}

function DocTableSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Title</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Category</TableHead>
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
                                <Skeleton className="h-5 w-[90px] rounded-full" />
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

function getCategoryBadge(category: string) {
    const colors: Record<string, string> = {
        'HOSTING': 'bg-chart-1/20 text-chart-1',
        'USERS': 'bg-chart-3/20 text-chart-3',
        'INTEGRATIONS': 'bg-chart-4/20 text-chart-4',
        'MAIN': 'bg-primary/20 text-primary',
    }
    return (
        <Badge className={`${colors[category] || 'bg-muted/50 text-muted-foreground'} border-0 font-medium`}>
            {category}
        </Badge>
    )
}

export function DocList({ onEdit }: { onEdit?: (id: string) => void }) {
    const { toast } = useToast()
    const [docs, setDocs] = useState<DocRecord[]>([])
    const [loading, setLoading] = useState(false)

    async function load() {
        setLoading(true)
        try {
            const res = await fetch('/api/docs?all=true&limit=200', {
                credentials: 'include',
            })
            const json = await res.json()
            setDocs(json.data || [])
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
        if (!confirm('Delete this doc?')) return
        try {
            const res = await fetch(`/api/docs/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            if (!res.ok) throw new Error('Delete failed')
            toast({
                title: 'Document deleted',
                description: 'The document has been deleted successfully.',
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

    if (loading) return <DocTableSkeleton />
    if (!loading && docs.length === 0) {
        return (
            <div className="rounded-xl border border-border/50 border-dashed bg-background/30 p-12 text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <BookOpen className="h-7 w-7 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-medium mb-2">No documentation yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    Create documentation pages to help users understand your platform.
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
                        <TableHead className="text-muted-foreground font-medium">Category</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                        <TableHead className="text-right text-muted-foreground font-medium">Sort</TableHead>
                        <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {docs.map((doc) => (
                        <TableRow key={doc.id} className="border-border/50 group">
                            <TableCell className="font-medium max-w-[350px]">
                                <div className="truncate">{doc.title}</div>
                                <div className="text-xs text-muted-foreground font-mono mt-0.5">{doc.slug}</div>
                            </TableCell>
                            <TableCell>{getCategoryBadge(doc.category)}</TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                                {doc.sortOrder ?? '—'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(doc.id)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
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

export default DocList
