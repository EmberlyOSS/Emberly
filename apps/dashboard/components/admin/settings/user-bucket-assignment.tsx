'use client'

import { useCallback, useEffect, useState } from 'react'

import { Database, Layers, Loader2, Search, UserCircle, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

interface Bucket {
  id: string
  name: string
  isCore: boolean
  provisionStatus: string
}

interface UserBucket {
  id: string
  name: string | null
  email: string | null
  image: string | null
  storageBucketId: string | null
  storageBucket: {
    id: string
    name: string
    isCore: boolean
    provisionStatus: string
  } | null
}

const PAGE_SIZE = 15

export function UserBucketAssignment() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserBucket[]>([])
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [pendingBucket, setPendingBucket] = useState<Record<string, string>>({})

  const fetchBuckets = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/storage/buckets')
      if (!res.ok) return
      const data = await res.json()
      setBuckets(
        (data.data ?? []).filter((b: Bucket) => b.provisionStatus === 'active')
      )
    } catch {
      // non-fatal
    }
  }, [])

  const fetchUsers = useCallback(
    async (p: number) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/users?page=${p}&limit=${PAGE_SIZE}`)
        if (!res.ok) throw new Error('Failed to load users')
        const data = await res.json()
        setUsers(data.data ?? [])
        setTotal(data.pagination?.total ?? 0)
      } catch {
        toast({ title: 'Failed to load users', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    fetchBuckets()
    fetchUsers(1)
  }, [fetchBuckets, fetchUsers])

  const handlePageChange = (p: number) => {
    setPage(p)
    fetchUsers(p)
  }

  const handleAssign = async (userId: string, bucketId: string | null) => {
    setSaving(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/storage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketId }),
      })
      if (!res.ok) throw new Error('Failed to assign bucket')

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u
          const bucket = buckets.find((b) => b.id === bucketId) ?? null
          return { ...u, storageBucketId: bucketId, storageBucket: bucket }
        })
      )
      setPendingBucket((p) => {
        const next = { ...p }
        delete next[userId]
        return next
      })
      toast({
        title: bucketId ? 'Bucket assigned' : 'Bucket assignment cleared',
        description: bucketId
          ? 'Credentials email sent to the user.'
          : undefined,
      })
    } catch {
      toast({
        title: 'Failed to update bucket assignment',
        variant: 'destructive',
      })
    } finally {
      setSaving(null)
    }
  }

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          className="w-full h-9 rounded-lg border border-border/50 bg-muted/20 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          placeholder="Filter by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearch('')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* User list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
            >
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-40" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border/50 border-dashed p-8 text-center text-sm text-muted-foreground">
            No users found
          </div>
        ) : (
          filtered.map((user) => {
            const currentBucketId = user.storageBucketId ?? ''
            const selectedBucket = pendingBucket[user.id] ?? currentBucketId
            const isDirty = pendingBucket[user.id] !== undefined

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
              >
                {/* Avatar */}
                <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.name ?? '(no name)'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>

                {/* Current assignment badge */}
                <div className="hidden sm:flex items-center shrink-0">
                  {user.storageBucket ? (
                    <Badge
                      className={`text-[10px] py-0 gap-1 ${user.storageBucket.isCore ? 'bg-violet-500/15 text-violet-400 border border-violet-400/30' : 'bg-blue-500/15 text-blue-400 border border-blue-400/30'}`}
                    >
                      {user.storageBucket.isCore ? (
                        <Layers className="h-2.5 w-2.5" />
                      ) : (
                        <Database className="h-2.5 w-2.5" />
                      )}
                      {user.storageBucket.name}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 text-muted-foreground"
                    >
                      default
                    </Badge>
                  )}
                </div>

                {/* Bucket select + assign button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Select
                    value={selectedBucket || 'none'}
                    onValueChange={(v) =>
                      setPendingBucket((p) => ({
                        ...p,
                        [user.id]: v === 'none' ? '' : v,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue placeholder="Select bucket…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">
                          Default (core pool)
                        </span>
                      </SelectItem>
                      {buckets.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          <div className="flex items-center gap-1.5">
                            {b.isCore ? (
                              <Layers className="h-3 w-3 text-violet-400" />
                            ) : (
                              <Database className="h-3 w-3 text-blue-400" />
                            )}
                            {b.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant={isDirty ? 'default' : 'ghost'}
                    className="h-8 px-2.5 text-xs"
                    disabled={!isDirty || saving === user.id}
                    onClick={() =>
                      handleAssign(user.id, selectedBucket || null)
                    }
                  >
                    {saving === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && !search && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
