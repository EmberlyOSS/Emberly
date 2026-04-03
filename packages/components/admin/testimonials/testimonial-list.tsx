'use client'

import { useEffect, useState } from 'react'

import { MessageSquareQuote, Star, Trash2, MoreHorizontal, Check, X, Archive, Eye, EyeOff } from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Skeleton } from '@/packages/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/packages/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/packages/components/ui/dropdown-menu'

function TestimonialSkeleton() {
    return (
        <div className="space-y-4">
            {/* Mobile skeleton */}
            <div className="lg:hidden space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="relative rounded-xl bg-background/80 backdrop-blur-lg border border-border/50 p-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <div className="flex items-center justify-between pt-2">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop skeleton */}
            <div className="hidden lg:block rounded-xl border border-border/50 bg-background/80 backdrop-blur-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead>User</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(3)].map((_, i) => (
                            <TableRow key={i} className="border-border/50">
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

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

    if (loading) return <TestimonialSkeleton />

    const getStatusBadge = (item: any) => {
        if (item.archived) return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
        if (item.hidden) return <Badge variant="secondary" className="bg-muted/50">Hidden</Badge>
        if (!item.approved) return <Badge className="bg-chart-4/20 text-chart-4 border-0">Pending</Badge>
        return <Badge className="bg-chart-2/20 text-chart-2 border-0">Approved</Badge>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <MessageSquareQuote className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Testimonials</h2>
                        <p className="text-sm text-muted-foreground">{items.length} testimonial{items.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => load()}>Refresh</Button>
            </div>

            {items.length === 0 ? (
                <div className="rounded-xl border border-border/50 border-dashed bg-background/80 p-12 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <MessageSquareQuote className="h-7 w-7 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No testimonials yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        User testimonials will appear here once submitted.
                    </p>
                </div>
            ) : (
                <div className="glass-subtle overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead>User</TableHead>
                                <TableHead>Content</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((t) => (
                                <TableRow key={t.id} className="border-border/50 group">
                                    <TableCell className="font-medium">{t.user?.name ?? t.user?.urlId}</TableCell>
                                    <TableCell className="max-w-md truncate text-muted-foreground">{t.content}</TableCell>
                                    <TableCell>
                                        {t.rating ? (
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                                                <span className="text-sm">{t.rating}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(t)}</TableCell>
                                    <TableCell>
                                        {/* Desktop: inline buttons with hover */}
                                        <div className="hidden lg:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" onClick={() => approve(t.id, !t.approved)} className="h-8 hover:bg-chart-2/10 hover:text-chart-2">
                                                {t.approved ? 'Unapprove' : 'Approve'}
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => toggleArchive(t.id, !t.archived)} className="h-8">
                                                {t.archived ? 'Unarchive' : 'Archive'}
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => toggleHidden(t.id, !t.hidden)} className="h-8">
                                                {t.hidden ? 'Unhide' : 'Hide'}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => remove(t.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Mobile: dropdown menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild className="lg:hidden">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => approve(t.id, !t.approved)} className="cursor-pointer">
                                                    {t.approved ? (
                                                        <>
                                                            <X className="h-4 w-4 mr-2" />
                                                            Unapprove
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Approve
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleHidden(t.id, !t.hidden)} className="cursor-pointer">
                                                    {t.hidden ? (
                                                        <>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Unhide
                                                        </>
                                                    ) : (
                                                        <>
                                                            <EyeOff className="h-4 w-4 mr-2" />
                                                            Hide
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleArchive(t.id, !t.archived)} className="cursor-pointer">
                                                    {t.archived ? (
                                                        <>
                                                            <Archive className="h-4 w-4 mr-2" />
                                                            Unarchive
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Archive className="h-4 w-4 mr-2" />
                                                            Archive
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => remove(t.id)} className="cursor-pointer text-destructive focus:text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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

export default TestimonialList
