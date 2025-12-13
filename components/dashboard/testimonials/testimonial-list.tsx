'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export function TestimonialList() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    async function load() {
        setLoading(true)
        try {
            const res = await fetch('/api/testimonials?all=true')
            const payload = await res.json()
            const value = Array.isArray(payload) ? payload : payload?.data
            setItems(Array.isArray(value) ? value : [])
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function approve(id: string, approved: boolean) {
        await fetch(`/api/testimonials/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approved }) })
        load()
    }

    async function toggleArchive(id: string, archived: boolean) {
        await fetch(`/api/testimonials/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived }) })
        load()
    }

    async function toggleHidden(id: string, hidden: boolean) {
        await fetch(`/api/testimonials/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hidden }) })
        load()
    }

    async function remove(id: string) {
        if (!confirm('Delete testimonial?')) return
        await fetch(`/api/testimonials/${id}`, { method: 'DELETE' })
        load()
    }

    if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>
    if (items.length === 0) return <div className="rounded-md border p-6 text-center">No testimonials</div>

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Approved</TableHead>
                        <TableHead>Archived</TableHead>
                        <TableHead>Hidden</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell>{t.user?.name ?? t.user?.urlId}</TableCell>
                            <TableCell className="max-w-md truncate">{t.content}</TableCell>
                            <TableCell>{t.rating ?? '-'}</TableCell>
                            <TableCell>{t.approved ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{t.archived ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{t.hidden ? 'Yes' : 'No'}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => approve(t.id, !t.approved)}>{t.approved ? 'Unapprove' : 'Approve'}</Button>
                                    <Button variant="ghost" onClick={() => toggleArchive(t.id, !t.archived)}>{t.archived ? 'Unarchive' : 'Archive'}</Button>
                                    <Button variant="ghost" onClick={() => toggleHidden(t.id, !t.hidden)}>{t.hidden ? 'Unhide' : 'Hide'}</Button>
                                    <Button variant="destructive" onClick={() => remove(t.id)}>Delete</Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default TestimonialList
