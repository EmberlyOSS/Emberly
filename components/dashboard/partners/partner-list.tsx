'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import PartnerForm from './partner-form'

export function PartnerList() {
    const [partners, setPartners] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<any | null>(null)
    const [open, setOpen] = useState(false)

    async function load() {
        setLoading(true)
        try {
            const res = await fetch('/api/partners?all=true')
            const payload = await res.json()
            if (res.ok) {
                // API responses are wrapped as { data, success }
                const value = Array.isArray(payload) ? payload : payload?.data
                setPartners(Array.isArray(value) ? value : [])
            }
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    function onSaved(p: any) {
        setOpen(false)
        load()
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete partner?')) return
        await fetch(`/api/partners/${id}`, { method: 'DELETE' })
        load()
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Partners</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setEditing(null); setOpen(true) }}>+ New Partner</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Partner' : 'New Partner'}</DialogTitle>
                        </DialogHeader>
                        <PartnerForm partner={editing} onSaved={onSaved} onCancel={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
            ) : partners.length === 0 ? (
                <div className="rounded-md border p-6 text-center">
                    <div className="text-lg font-medium">No partners yet</div>
                    <div className="text-sm text-muted-foreground mt-2">Add partners to show on the homepage.</div>
                    <div className="mt-4">
                        <Button onClick={() => { setEditing(null); setOpen(true) }}>+ New Partner</Button>
                    </div>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Tagline</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {partners.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.name}</TableCell>
                                    <TableCell>{p.tagline}</TableCell>
                                    <TableCell>{p.active ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" onClick={() => { setEditing(p); setOpen(true) }}>Edit</Button>
                                            <Button variant="destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

export default PartnerList
