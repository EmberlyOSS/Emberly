"use client"

import { useEffect, useState } from 'react'
import { Edit2, Trash2 } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Skeleton } from '@/packages/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/packages/components/ui/table'

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
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Published</TableHead>
                        <TableHead className="text-right">Sort</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <Skeleton className="h-4 w-[220px]" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-[90px]" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-[120px]" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-20" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-4 w-24 ml-auto" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-4 w-12 ml-auto" />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export function DocList({ onEdit }: { onEdit?: (id: string) => void }) {
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
            await load()
        } catch (e) {
            alert(String(e))
        }
    }

    if (loading) return <DocTableSkeleton />
    if (!loading && docs.length === 0) {
        return <div className="text-center text-muted-foreground">No docs yet.</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Published</TableHead>
                        <TableHead className="text-right">Sort</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {docs.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium max-w-[350px] truncate">
                                {doc.title}
                                {doc.excerpt && (
                                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {doc.excerpt}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="uppercase text-xs font-medium tracking-wide text-muted-foreground">
                                {doc.category}
                            </TableCell>
                            <TableCell className="max-w-[220px] truncate">{doc.slug}</TableCell>
                            <TableCell>{doc.status}</TableCell>
                            <TableCell className="text-right">
                                {doc.publishedAt ? new Date(doc.publishedAt).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell className="text-right">{doc.sortOrder ?? '-'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(doc.id)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
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
