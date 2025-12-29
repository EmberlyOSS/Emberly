'use client'

import React, { useCallback, useEffect, useState } from 'react'

import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    Clock,
    Copy,
    History,
    Mail,
    RefreshCw,
    Search,
    Send,
    Users,
    X,
} from 'lucide-react'

import { Alert, AlertDescription } from '@/packages/components/ui/alert'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Checkbox } from '@/packages/components/ui/checkbox'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/packages/components/ui/select'
import { Separator } from '@/packages/components/ui/separator'
import { Skeleton } from '@/packages/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
import { Textarea } from '@/packages/components/ui/textarea'

import { useToast } from '@/packages/hooks/use-toast'

interface User {
    id: string
    name: string | null
    email: string | null
    role: 'SUPERADMIN' | 'ADMIN' | 'USER'
    emailNotificationsEnabled: boolean
}

interface EmailStats {
    totalSent: number
    pending: number
    failed: number
    lastSentAt: string | null
}

interface EmailLog {
    id: string
    to: string
    subject: string
    template: string
    messageId: string | null
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SCHEDULED'
    type?: 'email.sent' | 'email.failed'
    createdAt: string
    processedAt: string | null
    failedAt: string | null
    error: string | null
    willRetry?: boolean
}

const EMAIL_CATEGORIES = [
    { value: 'all', label: 'All Users' },
    { value: 'subscribed', label: 'Subscribed Users Only' },
    { value: 'admins', label: 'Admins Only' },
    { value: 'selected', label: 'Selected Users' },
]

const EMAIL_PRIORITY = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
]

export function AdminEmailManager() {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [isLoadingLogs, setIsLoadingLogs] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [stats, setStats] = useState<EmailStats | null>(null)
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
    const [logsTotal, setLogsTotal] = useState(0)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [userSearch, setUserSearch] = useState('')

    // Email form state
    const [recipient, setRecipient] = useState('all')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [priority, setPriority] = useState('normal')

    // Logs filter state
    const [logsStatus, setLogsStatus] = useState('all')
    const [logsOffset, setLogsOffset] = useState(0)
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch('/api/users?limit=1000')
            if (!response.ok) throw new Error('Failed to fetch users')
            const data = await response.json()
            setUsers(data.data || [])
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to load users',
                variant: 'destructive',
            })
        }
    }, [toast])

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/email/stats')
            if (response.ok) {
                const data = await response.json()
                // Handle both wrapped response (apiResponse) and direct response
                const stats = data.data || data
                setStats(stats)
            }
        } catch {
            setStats({
                totalSent: 0,
                pending: 0,
                failed: 0,
                lastSentAt: null,
            })
        }
    }, [])

    const fetchLogs = useCallback(async () => {
        setIsLoadingLogs(true)
        try {
            const params = new URLSearchParams()
            params.set('status', logsStatus)
            params.set('offset', logsOffset.toString())
            params.set('limit', '50')

            const response = await fetch(`/api/admin/email/logs?${params.toString()}`)
            if (response.ok) {
                const data = await response.json()
                const { logs, pagination } = data.data || data
                setEmailLogs(logs || [])
                setLogsTotal(pagination?.total || 0)
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load email logs',
                variant: 'destructive',
            })
        } finally {
            setIsLoadingLogs(false)
        }
    }, [logsStatus, logsOffset, toast])

    useEffect(() => {
        Promise.all([fetchUsers(), fetchStats()]).finally(() => setIsLoading(false))
    }, [fetchUsers, fetchStats])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.name?.toLowerCase().includes(userSearch.toLowerCase())
    )

    const getRecipientCount = () => {
        switch (recipient) {
            case 'all':
                return users.length
            case 'subscribed':
                return users.filter(u => u.emailNotificationsEnabled).length
            case 'admins':
                return users.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length
            case 'selected':
                return selectedUsers.length
            default:
                return 0
        }
    }

    const getRecipientEmails = () => {
        switch (recipient) {
            case 'all':
                return users.filter(u => u.email).map(u => u.email!)
            case 'subscribed':
                return users.filter(u => u.email && u.emailNotificationsEnabled).map(u => u.email!)
            case 'admins':
                return users.filter(u => u.email && u.role === 'ADMIN' || u.role === 'SUPERADMIN').map(u => u.email!)
            case 'selected':
                return users.filter(u => selectedUsers.includes(u.id) && u.email).map(u => u.email!)
            default:
                return []
        }
    }

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const selectAllVisible = () => {
        const visibleIds = filteredUsers.map(u => u.id)
        setSelectedUsers(prev => {
            const newSelection = new Set([...prev, ...visibleIds])
            return Array.from(newSelection)
        })
    }

    const clearSelection = () => {
        setSelectedUsers([])
    }

    const handleSendEmail = async () => {
        if (!subject.trim() || !body.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Subject and body are required',
                variant: 'destructive',
            })
            return
        }

        const emails = getRecipientEmails()
        if (emails.length === 0) {
            toast({
                title: 'No Recipients',
                description: 'No users match the selected criteria',
                variant: 'destructive',
            })
            return
        }

        setIsSending(true)
        try {
            const response = await fetch('/api/admin/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: emails,
                    subject,
                    body,
                    priority,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to send emails')
            }

            const result = await response.json()

            toast({
                title: 'Emails Queued',
                description: `${result.data.queued} emails have been queued for delivery`,
            })

            // Reset form
            setSubject('')
            setBody('')
            setSelectedUsers([])
            fetchStats()
        } catch (error) {
            toast({
                title: 'Send Failed',
                description: error instanceof Error ? error.message : 'Failed to send emails',
                variant: 'destructive',
            })
        } finally {
            setIsSending(false)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-[400px] rounded-xl" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Total Users</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{users.length}</div>
                    <p className="text-xs text-muted-foreground">
                        {users.filter(u => u.emailNotificationsEnabled).length} subscribed
                    </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Emails Sent</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10">
                            <CheckCircle2 className="h-4 w-4 text-chart-2" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{stats?.totalSent ?? 0}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                </div>

                <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Pending</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10">
                            <Clock className="h-4 w-4 text-chart-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{stats?.pending ?? 0}</div>
                    <p className="text-xs text-muted-foreground">In queue</p>
                </div>

                <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Failed</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{stats?.failed ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Need attention</p>
                </div>
            </div>

            {/* Tabs Content */}
            <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
                <Tabs defaultValue="compose" className="w-full">
                    <div className="border-b border-border/50 px-4 py-2 bg-background/50">
                        <TabsList className="bg-transparent gap-2">
                            <TabsTrigger value="compose" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
                                <Mail className="h-4 w-4" />
                                Compose
                            </TabsTrigger>
                            <TabsTrigger value="users" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
                                <Users className="h-4 w-4" />
                                Select Users
                            </TabsTrigger>
                            <TabsTrigger value="logs" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
                                <History className="h-4 w-4" />
                                Logs
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-4 sm:p-6">
                        <TabsContent value="compose" className="mt-0 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Recipients</Label>
                                    <Select value={recipient} onValueChange={setRecipient}>
                                        <SelectTrigger className="bg-background/50 border-border/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EMAIL_CATEGORIES.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {getRecipientCount()} recipient(s) selected
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EMAIL_PRIORITY.map(p => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="Enter email subject..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="body">Message</Label>
                                <Textarea
                                    id="body"
                                    placeholder="Enter your message..."
                                    rows={10}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Supports markdown formatting. Use {'{email}'} to include recipient&apos;s email, {'{name}'} for their name.
                                </p>
                            </div>

                            {recipient === 'selected' && selectedUsers.length === 0 && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        No users selected. Go to the &quot;Select Users&quot; tab to choose specific recipients.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Separator />

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline">
                                        {getRecipientCount()} recipients
                                    </Badge>
                                    {priority === 'high' && (
                                        <Badge variant="destructive">High Priority</Badge>
                                    )}
                                </div>

                                <Button
                                    onClick={handleSendEmail}
                                    disabled={isSending || !subject.trim() || !body.trim() || getRecipientCount() === 0}
                                    className="w-full sm:w-auto"
                                >
                                    {isSending ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Email
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="users" className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                <div className="relative w-full sm:flex-1 sm:max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={selectAllVisible} className="flex-1 sm:flex-none text-xs sm:text-sm">
                                        <span className="hidden sm:inline">Select All Visible</span>
                                        <span className="sm:hidden">Select All</span>
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={clearSelection} className="flex-1 sm:flex-none text-xs sm:text-sm">
                                        <X className="h-4 w-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Clear ({selectedUsers.length})</span>
                                        <span className="sm:hidden">({selectedUsers.length})</span>
                                    </Button>
                                </div>
                            </div>

                            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                                {filteredUsers.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No users found
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {filteredUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-4 p-3 hover:bg-muted/50 cursor-pointer"
                                                onClick={() => toggleUserSelection(user.id)}
                                            >
                                                <Checkbox
                                                    checked={selectedUsers.includes(user.id)}
                                                    onCheckedChange={() => toggleUserSelection(user.id)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">
                                                        {user.name || 'No name'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground truncate">
                                                        {user.email || 'No email'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {user.role === 'SUPERADMIN' && (
                                                        <Badge variant="default">Manager</Badge>
                                                    )}
                                                    {user.role === 'ADMIN' && (
                                                        <Badge variant="default">Admin</Badge>
                                                    )}
                                                    {!user.emailNotificationsEnabled && (
                                                        <Badge variant="outline" className="text-yellow-600">
                                                            Unsubscribed
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedUsers.length > 0 && (
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>
                                        {selectedUsers.length} user(s) selected. Set recipients to &quot;Selected Users&quot; in the Compose tab.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </TabsContent>

                        <TabsContent value="logs" className="space-y-4">
                            {/* Logs Filters */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="status-filter" className="text-sm whitespace-nowrap">Status:</Label>
                                    <Select value={logsStatus} onValueChange={(value) => {
                                        setLogsStatus(value)
                                        setLogsOffset(0)
                                    }}>
                                        <SelectTrigger className="w-full sm:w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="sent">Sent</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchLogs()}
                                    disabled={isLoadingLogs}
                                    className="w-full sm:w-auto"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                                    <span className="ml-2">Refresh</span>
                                </Button>
                            </div>

                            {/* Logs Table */}
                            {isLoadingLogs ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : emailLogs.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground border rounded-lg">
                                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No email logs found</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="sm:hidden space-y-3">
                                        {emailLogs.map((log) => (
                                            <div key={log.id} className="border rounded-lg p-4 space-y-2 bg-card">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate" title={log.to}>
                                                            {log.to}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(log.createdAt).toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </div>
                                                    {log.status === 'COMPLETED' && (
                                                        <Badge className="bg-green-900/50 text-green-200 hover:bg-green-900/50 border-green-700 text-xs">
                                                            ✓ Sent
                                                        </Badge>
                                                    )}
                                                    {log.status === 'PENDING' && (
                                                        <Badge className="bg-yellow-900/50 text-yellow-200 hover:bg-yellow-900/50 border-yellow-700 text-xs">
                                                            ⏱ Pending
                                                        </Badge>
                                                    )}
                                                    {log.status === 'PROCESSING' && (
                                                        <Badge className="bg-blue-900/50 text-blue-200 hover:bg-blue-900/50 border-blue-700 text-xs">
                                                            ⟳ Processing
                                                        </Badge>
                                                    )}
                                                    {log.status === 'FAILED' && (
                                                        <Badge className="bg-red-900/50 text-red-200 hover:bg-red-900/50 border-red-700 text-xs">
                                                            ✕ Failed
                                                        </Badge>
                                                    )}
                                                    {log.status === 'SCHEDULED' && (
                                                        <Badge className="bg-purple-900/50 text-purple-200 hover:bg-purple-900/50 border-purple-700 text-xs">
                                                            📅 Scheduled
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm truncate" title={log.subject}>
                                                    {log.subject || 'No subject'}
                                                </p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {log.template}
                                                    </Badge>
                                                    {log.error && (
                                                        <span className="text-xs text-red-400 truncate" title={log.error}>
                                                            Error: {log.error.slice(0, 30)}...
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block border rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-muted/50">
                                                        <th className="px-4 py-3 text-left font-medium">Sent At</th>
                                                        <th className="px-4 py-3 text-left font-medium">Recipient</th>
                                                        <th className="px-4 py-3 text-left font-medium">Subject</th>
                                                        <th className="px-4 py-3 text-left font-medium">Template</th>
                                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                                        <th className="px-4 py-3 text-left font-medium">Message ID</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {emailLogs.map((log) => (
                                                        <React.Fragment key={log.id}>
                                                            <tr
                                                                className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                                                                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                                            >
                                                                <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                                    {new Date(log.createdAt).toLocaleString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs truncate max-w-xs" title={log.to}>
                                                                    {log.to}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs truncate max-w-sm" title={log.subject}>
                                                                    {log.subject}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs">
                                                                    <Badge variant="outline" className="font-mono">
                                                                        {log.template}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        {log.status === 'COMPLETED' && (
                                                                            <Badge className="bg-green-900/50 text-green-200 hover:bg-green-900/50 border-green-700">
                                                                                ✓ Sent
                                                                            </Badge>
                                                                        )}
                                                                        {log.status === 'PENDING' && (
                                                                            <Badge className="bg-yellow-900/50 text-yellow-200 hover:bg-yellow-900/50 border-yellow-700">
                                                                                ⏱ Pending
                                                                            </Badge>
                                                                        )}
                                                                        {log.status === 'PROCESSING' && (
                                                                            <Badge className="bg-blue-900/50 text-blue-200 hover:bg-blue-900/50 border-blue-700">
                                                                                ⟳ Processing
                                                                            </Badge>
                                                                        )}
                                                                        {log.status === 'FAILED' && (
                                                                            <Badge className="bg-red-900/50 text-red-200 hover:bg-red-900/50 border-red-700">
                                                                                ✕ Failed
                                                                            </Badge>
                                                                        )}
                                                                        {log.status === 'SCHEDULED' && (
                                                                            <Badge className="bg-purple-900/50 text-purple-200 hover:bg-purple-900/50 border-purple-700">
                                                                                📅 Scheduled
                                                                            </Badge>
                                                                        )}
                                                                        <ChevronDown
                                                                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                                                                                expandedLogId === log.id ? 'rotate-180' : ''
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-xs font-mono text-muted-foreground truncate max-w-xs" title={log.messageId || 'N/A'}>
                                                                    {log.messageId ? log.messageId.slice(0, 20) + '...' : 'N/A'}
                                                                </td>
                                                            </tr>
                                                            {expandedLogId === log.id && (
                                                                <tr className="border-b bg-muted/20">
                                                                    <td colSpan={6} className="px-4 py-4">
                                                                        <div className="space-y-3">
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Full Email Address</p>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <code className="text-xs bg-background p-2 rounded border border-border/50 flex-1 truncate">
                                                                                            {log.to}
                                                                                        </code>
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="ghost"
                                                                                            className="h-8 w-8 p-0"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation()
                                                                                                navigator.clipboard.writeText(log.to)
                                                                                                toast({ title: 'Copied!', description: 'Email address copied to clipboard' })
                                                                                            }}
                                                                                        >
                                                                                            <Copy className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>

                                                                                <div>
                                                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Message ID</p>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <code className="text-xs bg-background p-2 rounded border border-border/50 flex-1 truncate font-mono">
                                                                                            {log.messageId || 'N/A'}
                                                                                        </code>
                                                                                        {log.messageId && (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="ghost"
                                                                                                className="h-8 w-8 p-0"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    navigator.clipboard.writeText(log.messageId || '')
                                                                                                    toast({ title: 'Copied!', description: 'Message ID copied to clipboard' })
                                                                                                }}
                                                                                            >
                                                                                                <Copy className="h-3 w-3" />
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div>
                                                                                <p className="text-xs font-medium text-muted-foreground mb-1">Full Subject</p>
                                                                                <p className="text-sm bg-background p-2 rounded border border-border/50">
                                                                                    {log.subject || '(No subject)'}
                                                                                </p>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Created</p>
                                                                                    <p className="text-xs text-foreground">
                                                                                        {new Date(log.createdAt).toLocaleString()}
                                                                                    </p>
                                                                                </div>
                                                                                {log.processedAt && (
                                                                                    <div>
                                                                                        <p className="text-xs font-medium text-muted-foreground mb-1">Processed</p>
                                                                                        <p className="text-xs text-foreground">
                                                                                            {new Date(log.processedAt).toLocaleString()}
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {log.error && (
                                                                                <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50">
                                                                                    <p className="text-xs font-medium text-red-200 mb-1">Error Message</p>
                                                                                    <p className="text-sm text-red-100 font-mono whitespace-pre-wrap break-words">
                                                                                        {log.error}
                                                                                    </p>
                                                                                    {log.willRetry && (
                                                                                        <p className="text-xs text-red-200 mt-2">
                                                                                            ⟳ Will retry
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                <div className="p-2 rounded border border-border/50 bg-background/50">
                                                                                    <p className="text-muted-foreground">Template</p>
                                                                                    <code className="font-mono text-foreground">{log.template}</code>
                                                                                </div>
                                                                                <div className="p-2 rounded border border-border/50 bg-background/50">
                                                                                    <p className="text-muted-foreground">Event Type</p>
                                                                                    <code className="font-mono text-foreground">{log.type || 'unknown'}</code>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Pagination */}
                            {emailLogs.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                        Showing {logsOffset + 1} - {Math.min(logsOffset + 50, logsTotal)} of {logsTotal}
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLogsOffset(Math.max(0, logsOffset - 50))}
                                            disabled={logsOffset === 0 || isLoadingLogs}
                                            className="flex-1 sm:flex-none"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setLogsOffset(logsOffset + 50)}
                                            disabled={logsOffset + 50 >= logsTotal || isLoadingLogs}
                                            className="flex-1 sm:flex-none"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}
