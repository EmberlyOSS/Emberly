'use client'

import { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'

import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  Settings,
  Trash2,
} from 'lucide-react'

import { FilterTabs } from '@/components/layout/page-kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import {
  CATEGORY_LABELS,
  type NotificationData,
  NotificationItem,
} from './notification-item'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'security', label: CATEGORY_LABELS.security },
  { value: 'account', label: CATEGORY_LABELS.account },
  { value: 'billing', label: CATEGORY_LABELS.billing },
  { value: 'productUpdates', label: CATEGORY_LABELS.productUpdates },
]

async function send(method: 'PATCH' | 'DELETE', ids?: string[]) {
  await fetch('/api/notifications', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids ? { ids } : {}),
  })
}

export function NotificationsClient() {
  const [filter, setFilter] = useState('all')
  const [confirmClear, setConfirmClear] = useState(false)
  const [items, setItems] = useState<NotificationData[] | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(
    async (after?: string) => {
      const params = new URLSearchParams({ limit: '30' })
      if (filter === 'unread') params.set('unread', 'true')
      else if (filter !== 'all') params.set('category', filter)
      if (after) params.set('cursor', after)
      const res = await fetch(`/api/notifications?${params}`, {
        cache: 'no-store',
      })
      if (!res.ok) return
      const { data } = await res.json()
      setUnread(data.unread)
      setCursor(data.nextCursor)
      setItems((current) =>
        after && current ? [...current, ...data.items] : data.items
      )
    },
    [filter]
  )

  useEffect(() => {
    setItems(null)
    load()
  }, [load])

  const update = (ids: string[] | undefined, change: 'read' | 'delete') => {
    const affected = (n: NotificationData) => !ids || ids.includes(n.id)
    const newlyRead = items?.filter((n) => affected(n) && !n.readAt).length ?? 0
    setUnread((count) => (ids ? Math.max(0, count - newlyRead) : 0))
    setItems((list) =>
      !list
        ? list
        : change === 'delete'
          ? list.filter((n) => !affected(n))
          : list.map((n) =>
              affected(n) && !n.readAt
                ? { ...n, readAt: new Date().toISOString() }
                : n
            )
    )
    send(change === 'delete' ? 'DELETE' : 'PATCH', ids)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          label="Filter notifications"
          options={FILTERS.map((f) => ({
            ...f,
            count: f.value === 'unread' && unread > 0 ? unread : undefined,
          }))}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={unread === 0}
            onClick={() => update(undefined, 'read')}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Mark all read
          </Button>
          {confirmClear ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setConfirmClear(false)
                  update(undefined, 'delete')
                }}
              >
                Delete all
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={!items?.length}
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Clear all
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/me?tab=notifications"
              aria-label="Notification settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="glass-card overflow-hidden p-1.5">
        {items === null ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center">
            <Bell className="mx-auto h-7 w-7 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium">Nothing here</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign-in alerts, account changes and updates appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onOpen={(item) => !item.readAt && update([item.id], 'read')}
                actions={
                  <div className="flex shrink-0 gap-1 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    {!n.readAt && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Mark as read"
                        onClick={() => update([n.id], 'read')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Delete"
                      onClick={() => update([n.id], 'delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      {cursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={async () => {
              setLoadingMore(true)
              await load(cursor)
              setLoadingMore(false)
            }}
          >
            {loadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
