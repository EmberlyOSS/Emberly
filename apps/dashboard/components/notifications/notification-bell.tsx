'use client'

import { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'

import { Bell, CheckCheck, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { type NotificationData, NotificationItem } from './notification-item'

const POLL_MS = 60_000

async function markRead(ids?: string[]) {
  await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids ? { ids } : {}),
  })
}

// Every bell on the page (desktop and mobile nav) shares one poller
const listeners = new Set<(count: number) => void>()
let lastCount = 0
let lastFetch = 0
let inFlight: Promise<void> | null = null
let timer: ReturnType<typeof setInterval> | null = null

function pollUnread(force = false) {
  if (inFlight) return inFlight
  if (!force && Date.now() - lastFetch < 5_000) return Promise.resolve()
  inFlight = fetch('/api/notifications?limit=1', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => {
      if (body?.data) {
        lastCount = body.data.unread
        listeners.forEach((fn) => fn(lastCount))
      }
    })
    .catch(() => {})
    .finally(() => {
      lastFetch = Date.now()
      inFlight = null
    })
  return inFlight
}

const onFocus = () => pollUnread()

function subscribe(fn: (count: number) => void) {
  listeners.add(fn)
  fn(lastCount)
  if (listeners.size === 1) {
    pollUnread()
    timer = setInterval(() => pollUnread(true), POLL_MS)
    window.addEventListener('focus', onFocus)
  }
  return () => {
    listeners.delete(fn)
    if (listeners.size === 0) {
      if (timer) clearInterval(timer)
      timer = null
      window.removeEventListener('focus', onFocus)
    }
  }
}

function setSharedUnread(count: number) {
  lastCount = count
  listeners.forEach((fn) => fn(count))
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnreadState] = useState(0)
  const [items, setItems] = useState<NotificationData[] | null>(null)

  const setUnread = useCallback(
    (next: number | ((n: number) => number)) =>
      setSharedUnread(typeof next === 'function' ? next(lastCount) : next),
    []
  )

  const refresh = useCallback(
    async (withItems: boolean) => {
      if (!withItems) return pollUnread(true)
      try {
        const res = await fetch('/api/notifications?limit=8', {
          cache: 'no-store',
        })
        if (!res.ok) return
        const { data } = await res.json()
        setUnread(data.unread)
        setItems(data.items)
      } catch {}
    },
    [setUnread]
  )

  useEffect(() => subscribe(setUnreadState), [])

  useEffect(() => {
    if (open) refresh(true)
  }, [open, refresh])

  const openItem = (notification: NotificationData) => {
    if (!notification.readAt) {
      markRead([notification.id])
      setUnread((n) => Math.max(0, n - 1))
    }
    setOpen(false)
  }

  const readAll = async () => {
    await markRead()
    setUnread(0)
    setItems(
      (list) =>
        list?.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        })) ?? null
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          aria-label={
            unread ? `Notifications, ${unread} unread` : 'Notifications'
          }
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={readAll}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto p-1.5">
          {items === null ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto h-6 w-6 text-muted-foreground/60" />
              <p className="mt-2 text-sm text-muted-foreground">
                You're all caught up.
              </p>
            </div>
          ) : (
            items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onOpen={openItem}
                compact
              />
            ))
          )}
        </div>
        <div className="border-t border-border/60 p-1.5">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            <Link href="/dashboard/notifications">See all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
