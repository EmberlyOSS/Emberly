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
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
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

export function LegalList({ onEdit }: { onEdit?: (id: string) => void }) {
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
            await load()
        } catch (e) {
            alert(String(e))
        }
    }

    if (loading) return <LegalTableSkeleton />
    if (!loading && pages.length === 0) {
        return <div className="text-center text-muted-foreground">No legal pages yet.</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Published</TableHead>
                        <TableHead className="text-right">Sort</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pages.map((page) => (
                        <TableRow key={page.id}>
                            <TableCell className="font-medium max-w-[350px] truncate">
                                {page.title}
                                {page.excerpt && (
                                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {page.excerpt}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="max-w-[220px] truncate">{page.slug}</TableCell>
                            <TableCell>{page.status}</TableCell>
                            <TableCell className="text-right">
                                {page.publishedAt ? new Date(page.publishedAt).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell className="text-right">{page.sortOrder ?? '-'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(page.id)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)}>
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

export default LegalList
