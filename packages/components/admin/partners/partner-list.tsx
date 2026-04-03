'use client'

import { useEffect, useState } from 'react'
import { Edit2, Plus, Trash2, Users } from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/packages/components/ui/table'
import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import { Skeleton } from '@/packages/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/packages/components/ui/dialog'
import { useToast } from '@/packages/hooks/use-toast'
import PartnerForm from './partner-form'

function PartnerTableSkeleton() {
    return (
        <div className="glass-subtle overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Tagline</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                        <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(3)].map((_, i) => (
                        <TableRow key={i} className="border-border/50">
                            <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[220px]" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
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

export function PartnerList() {
    const { toast } = useToast()
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
            toast({
                title: 'Error',
                description: 'Failed to load partners',
                variant: 'destructive',
            })
        }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    function onSaved(p: any) {
        setOpen(false)
        load()
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm('Delete partner?')) return
        try {
            const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast({
                    title: 'Partner deleted',
                    description: `Successfully deleted ${name}`,
                })
                load()
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to delete partner',
                    variant: 'destructive',
                })
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Request failed',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Partners</h2>
                        <p className="text-sm text-muted-foreground">{partners.length} partner{partners.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setEditing(null); setOpen(true) }} className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Partner
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Partner' : 'New Partner'}</DialogTitle>
                        </DialogHeader>
                        <PartnerForm partner={editing} onSaved={onSaved} onCancel={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <PartnerTableSkeleton />
            ) : partners.length === 0 ? (
                <div className="rounded-xl border border-border/50 border-dashed bg-background/80 p-12 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-7 w-7 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No partners yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                        Add partners to showcase them on your homepage and build credibility.
                    </p>
                    <Button onClick={() => { setEditing(null); setOpen(true) }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add First Partner
                    </Button>
                </div>
            ) : (
                <div className="glass-subtle overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                                <TableHead className="text-muted-foreground font-medium">Tagline</TableHead>
                                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                                <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {partners.map((p) => (
                                <TableRow key={p.id} className="border-border/50 group">
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.tagline || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={p.active ? 'default' : 'secondary'} className={p.active ? 'bg-chart-2/20 text-chart-2 hover:bg-chart-2/30 border-0' : ''}>
                                            {p.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true) }} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.name)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
