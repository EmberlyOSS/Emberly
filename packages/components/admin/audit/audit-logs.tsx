'use client'

import { useEffect, useMemo, useState } from 'react'

import { CalendarRange, Filter, RefreshCw, Search, ShieldAlert } from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/packages/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/packages/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/packages/components/ui/table'
import { useDebounce } from '@/packages/hooks/use-debounce'
import { cn } from '@/packages/lib/utils'

const RESOURCES = [
    { value: 'all', label: 'All resources' },
    { value: 'auth', label: 'Auth' },
    { value: 'account', label: 'Account' },
    { value: 'security', label: 'Security' },
    { value: 'admin', label: 'Admin' },
    { value: 'billing', label: 'Billing' },
    { value: 'file', label: 'File' },
]

const STATUSES = [
    { value: 'all', label: 'All statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'FAILED', label: 'Failed' },
]

type AuditLog = {
    id: string
    type: string
    status: string
    action: string | null
    resource: string | null
    success: boolean | null
    error: string | null
    payload: unknown
    metadata: unknown
    failedAt: string | null
    processedAt: string | null
    scheduledAt: string | null
    retryCount: number | null
    maxRetries: number | null
    priority: number | null
    actorId: string | null
    actorEmail: string | null
    targetId: string | null
    targetEmail: string | null
    ip: string | null
    userAgent: string | null
    geo: { country?: string; region?: string; city?: string } | null
    createdAt: string
}

type ApiResult = {
    data: AuditLog[]
    pagination: {
        total: number
        pageCount: number
        page: number
        limit: number
    }
    success: boolean
}

function formatLocation(ip?: string | null, geo?: AuditLog['geo']) {
    const geoParts = [geo?.city, geo?.region, geo?.country].filter(Boolean)
    if (geoParts.length && ip) return `${geoParts.join(', ')} / ${ip}`
    if (geoParts.length) return geoParts.join(', ')
    return ip || '-'
}

function formatTime(value: string) {
    try {
        return new Date(value).toLocaleString()
    } catch (e) {
        return value
    }
}

function formatJsonSnippet(value: unknown, maxLen = 400) {
    try {
        const str = JSON.stringify(value, null, 2)
        if (!str) return ''
        if (str.length > maxLen) return `${str.slice(0, maxLen)}...`
        return str
    } catch (e) {
        return String(value)
    }
}

export function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 400)
    const [resource, setResource] = useState('all')
    const [status, setStatus] = useState('all')
    const [successFilter, setSuccessFilter] = useState('all')
    const [auditableOnly, setAuditableOnly] = useState('auditable') // 'auditable' | 'all'
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const limit = 20

    const queryString = useMemo(() => {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
        if (resource !== 'all') params.set('resource', resource)
        if (status !== 'all') params.set('status', status)
        if (successFilter !== 'all') params.set('success', successFilter)
        if (auditableOnly === 'auditable') params.set('auditableOnly', 'true')
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)
        return params.toString()
    }, [page, limit, debouncedSearch, resource, status, successFilter, auditableOnly, startDate, endDate])

    useEffect(() => {
        let cancelled = false
        async function load() {
            setIsLoading(true)
            setError(null)
            try {
                const response = await fetch(`/api/admin/audit/logs?${queryString}`)
                if (!response.ok) {
                    throw new Error('Failed to load audit logs')
                }
                const result = (await response.json()) as ApiResult
                if (cancelled) return
                setLogs(result.data || [])
                setPageCount(result.pagination?.pageCount || 1)
                setTotal(result.pagination?.total || 0)
            } catch (e) {
                if (cancelled) return
                setError(e instanceof Error ? e.message : 'Failed to load audit logs')
                setLogs([])
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [queryString])

    function resetFilters() {
        setSearch('')
        setResource('all')
        setStatus('all')
        setSuccessFilter('all')
        setAuditableOnly('auditable')
        setStartDate('')
        setEndDate('')
        setPage(1)
    }

    const hasFilters = useMemo(() => {
        return (
            Boolean(debouncedSearch) ||
            resource !== 'all' ||
            status !== 'all' ||
            successFilter !== 'all' ||
            auditableOnly !== 'auditable' ||
            startDate !== '' ||
            endDate !== ''
        )
    }, [debouncedSearch, resource, status, successFilter, auditableOnly, startDate, endDate])

    function statusBadge(eventStatus?: string | null, success?: boolean | null) {
        switch (eventStatus) {
            case 'COMPLETED':
                return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-200 border-emerald-500/30">Completed</Badge>
            case 'FAILED':
                return <Badge variant="secondary" className="bg-rose-500/15 text-rose-200 border-rose-500/30">Failed</Badge>
            case 'PROCESSING':
                return <Badge variant="secondary" className="bg-sky-500/15 text-sky-200 border-sky-500/30">Processing</Badge>
            case 'PENDING':
                return <Badge variant="secondary" className="bg-amber-500/15 text-amber-200 border-amber-500/30">Pending</Badge>
            case 'SCHEDULED':
                return <Badge variant="secondary" className="bg-indigo-500/15 text-indigo-200 border-indigo-500/30">Scheduled</Badge>
            default:
                if (success === true)
                    return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-200 border-emerald-500/30">Success</Badge>
                if (success === false)
                    return <Badge variant="secondary" className="bg-rose-500/15 text-rose-200 border-rose-500/30">Failed</Badge>
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Audit Logs</h1>
                        <p className="text-sm text-muted-foreground">
                            Search and filter critical actions across auth, account, security, billing, and admin operations.
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters}>
                            Reset
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-2">
                        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="glass-subtle overflow-hidden">
                <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-medium">Filters</h3>
                            <p className="text-sm text-muted-foreground">Layer filters to narrow down the audit trail.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Toggle which events to surface</span>
                        </div>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="md:col-span-2 xl:col-span-2">
                            <Label className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                <Search className="h-4 w-4" /> Search
                            </Label>
                            <Input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setPage(1)
                                }}
                                placeholder="Actor, target, email, action, IP"
                                className="mt-1.5 bg-background/50 border-border/50"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resource</Label>
                            <Select
                                value={resource}
                                onValueChange={(value) => {
                                    setResource(value)
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className="mt-1.5 bg-background/50 border-border/50">
                                    <SelectValue placeholder="Resource" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RESOURCES.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Result</Label>
                            <Select
                                value={successFilter}
                                onValueChange={(value) => {
                                    setSuccessFilter(value)
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className="mt-1.5 bg-background/50 border-border/50">
                                    <SelectValue placeholder="Result" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="true">Success</SelectItem>
                                    <SelectItem value="false">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 xl:col-span-2">
                            <div className="flex-1 min-w-[140px]">
                                <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <CalendarRange className="h-4 w-4" /> From
                                </Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value)
                                        setPage(1)
                                    }}
                                    className="mt-1.5 bg-background/50 border-border/50"
                                />
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <CalendarRange className="h-4 w-4" /> To
                                </Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value)
                                        setPage(1)
                                    }}
                                    className="mt-1.5 bg-background/50 border-border/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                        <div>
                            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Event scope</Label>
                            <Select
                                value={auditableOnly}
                                onValueChange={(value) => {
                                    setAuditableOnly(value)
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className="mt-1.5 bg-background/50 border-border/50">
                                    <SelectValue placeholder="Scope" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auditable">Auditable only</SelectItem>
                                    <SelectItem value="all">All events</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</Label>
                            <Select
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value)
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className="mt-1.5 bg-background/50 border-border/50">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-subtle overflow-hidden">
                <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="font-medium">Results</h3>
                            <p className="text-sm text-muted-foreground">
                                {isLoading ? 'Loading audit entries...' : `${total} entries`}
                            </p>
                        </div>
                        <Badge variant="secondary" className="bg-muted/50">
                            Page {page} / {pageCount || 1}
                        </Badge>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="w-[160px]">Timestamp</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Location / IP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        Loading audit logs…
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-destructive">
                                        {error}
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                                                <ShieldAlert className="h-6 w-6 text-primary" />
                                            </div>
                                            <p className="text-muted-foreground">No audit entries found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="border-border/50 hover:bg-primary/5">
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatTime(log.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">
                                                    {log.resource || log.type?.split('.')[0] || '-'} / {log.action || log.type?.split('.')[1] || '-'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{log.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{log.actorEmail || log.actorId || '-'}</span>
                                                {log.actorId && log.actorEmail ? (
                                                    <span className="text-xs text-muted-foreground">{log.actorId}</span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{log.targetEmail || log.targetId || '-'}</span>
                                                {log.targetId && log.targetEmail ? (
                                                    <span className="text-xs text-muted-foreground">{log.targetId}</span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {statusBadge(log.status, log.success)}
                                                {log.failedAt ? (
                                                    <span className="text-xs text-destructive">Failed at {formatTime(log.failedAt)}</span>
                                                ) : null}
                                                {typeof log.success === 'boolean' && !log.status ? (
                                                    <span className="text-xs text-muted-foreground">Outcome: {log.success ? 'Success' : 'Failed'}</span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                {log.error ? (
                                                    <span className="text-destructive">Error: {log.error}</span>
                                                ) : (
                                                    <span>No error</span>
                                                )}
                                                {log.metadata ? (
                                                    <pre className="max-h-24 overflow-auto rounded bg-muted/40 p-2 text-[11px] leading-snug text-foreground">{formatJsonSnippet(log.metadata)}</pre>
                                                ) : (
                                                    <span>Metadata: —</span>
                                                )}
                                                {log.payload ? (
                                                    <pre className="max-h-24 overflow-auto rounded bg-muted/40 p-2 text-[11px] leading-snug text-foreground">{formatJsonSnippet(log.payload)}</pre>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{formatLocation(log.ip, log.geo)}</span>
                                                {log.userAgent ? (
                                                    <span className="text-xs text-muted-foreground line-clamp-1" title={log.userAgent}>
                                                        {log.userAgent}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground px-4 pb-4">
                    <span>
                        Showing {(page - 1) * limit + (logs.length ? 1 : 0)}-
                        {(page - 1) * limit + logs.length} of {total}
                    </span>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    aria-disabled={page <= 1}
                                    className={cn(page <= 1 && 'pointer-events-none opacity-50')}
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        if (page > 1) setPage((p) => p - 1)
                                    }}
                                />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink isActive href="#">
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    aria-disabled={page >= pageCount}
                                    className={cn(page >= pageCount && 'pointer-events-none opacity-50')}
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        if (page < pageCount) setPage((p) => p + 1)
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    )
}
