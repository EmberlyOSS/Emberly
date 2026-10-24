'use client'

import { useEffect, useState } from 'react'

import { format, formatDistanceToNow } from 'date-fns'
import { Monitor, RefreshCw, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { describeDevice, parseUserAgent } from '@/lib/utils/user-agent'

import { useToast } from '@/hooks/use-toast'

interface LoginEntry {
  id: string
  ip: string | null
  userAgent: string | null
  country: string | null
  city: string | null
  createdAt: string
}

const PAGE = 5

export function LoginHistory() {
  const [history, setHistory] = useState<LoginEntry[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile/sessions?limit=50')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setHistory(data.loginHistory || [])
    } catch {
      setHistory((prev) => prev ?? [])
      toast({ title: "Couldn't load sign-in history", variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = history ? (showAll ? history : history.slice(0, PAGE)) : []

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Sign-in history</h3>
          <p className="text-sm text-muted-foreground">
            Recent sign-ins to your account.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={load}
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {history === null ? (
        <div className="flex justify-center py-6">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : history.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No sign-ins recorded yet.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
            {shown.map((entry) => {
              const mobile = parseUserAgent(entry.userAgent).device === 'Mobile'
              const Icon = mobile ? Smartphone : Monitor
              const place = [entry.city, entry.country]
                .filter(Boolean)
                .join(', ')
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {describeDevice(entry.userAgent) ?? 'Unknown device'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[place, entry.ip].filter(Boolean).join(' · ') ||
                        'Location unknown'}
                    </p>
                  </div>
                  <time
                    dateTime={entry.createdAt}
                    title={format(new Date(entry.createdAt), 'PPpp')}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {formatDistanceToNow(new Date(entry.createdAt), {
                      addSuffix: true,
                    })}
                  </time>
                </li>
              )
            })}
          </ul>
          {history.length > PAGE && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show less' : `Show ${history.length - PAGE} more`}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
