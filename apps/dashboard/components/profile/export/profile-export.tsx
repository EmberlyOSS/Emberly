'use client'

import { useCallback, useEffect, useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import { Download, Loader2, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { formatBytes } from '@/lib/utils'

import { useToast } from '@/hooks/use-toast'

interface DataExport {
  id: string
  status: 'pending' | 'ready' | 'failed' | 'expired'
  size: number | null
  createdAt: string
  completedAt: string | null
  expiresAt: string | null
}

const INCLUDED = [
  'Every file and paste you’ve uploaded, sorted by date',
  'Your profile, settings and notification preferences',
  'Your short links, custom domains and signed-in devices',
]

export function ProfileExport() {
  const [current, setCurrent] = useState<DataExport | null | undefined>()
  const [requesting, setRequesting] = useState(false)
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/export', { cache: 'no-store' })
      const body = await res.json()
      setCurrent(body.data?.export ?? null)
    } catch {
      setCurrent(null)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (current?.status !== 'pending') return
    const timer = setInterval(load, 10_000)
    return () => clearInterval(timer)
  }, [current?.status, load])

  const request = async () => {
    setRequesting(true)
    try {
      const res = await fetch('/api/profile/export', { method: 'POST' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || "Couldn't start your export")
      setCurrent(body.data.export)
      toast({
        title: 'Export started',
        description: "We'll email you a download link when it's ready.",
      })
    } catch (error) {
      toast({
        title: "Couldn't start your export",
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setRequesting(false)
    }
  }

  const pending = current?.status === 'pending'
  const ready = current?.status === 'ready'

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Export your data</h3>
        <p className="text-sm text-muted-foreground">
          We&apos;ll put everything in a ZIP file and email you a link to
          download it. The link works for 7 days, only while you&apos;re signed
          in.
        </p>
      </div>

      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {INCLUDED.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-primary">•</span>
            {item}
          </li>
        ))}
      </ul>

      {current === undefined ? (
        <div className="h-16 animate-pulse rounded-lg bg-muted/30" />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
          <div className="min-w-0 text-sm">
            {!current && (
              <p className="text-muted-foreground">
                You haven&apos;t exported your data yet.
              </p>
            )}
            {pending && (
              <p className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Preparing your export. We&apos;ll email you when it&apos;s
                ready.
              </p>
            )}
            {ready && current && (
              <>
                <p className="font-medium">Your export is ready</p>
                <p className="text-muted-foreground">
                  {current.size ? `${formatBytes(current.size)} · ` : ''}
                  Link expires{' '}
                  {current.expiresAt &&
                    formatDistanceToNow(new Date(current.expiresAt), {
                      addSuffix: true,
                    })}
                </p>
              </>
            )}
            {current?.status === 'expired' && (
              <p className="text-muted-foreground">
                Your last export&apos;s link has expired.
              </p>
            )}
            {current?.status === 'failed' && (
              <p className="text-destructive">
                Your last export didn&apos;t finish. Try again, or contact
                support if it keeps happening.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {ready && current && (
              <Button asChild size="sm">
                <a href={`/api/profile/export/${current.id}`}>
                  <Download className="mr-1.5 h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
            {!pending && (
              <Button
                size="sm"
                variant={ready ? 'outline' : 'default'}
                onClick={request}
                disabled={requesting}
              >
                {requesting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-1.5 h-4 w-4" />
                )}
                {ready ? 'Start a new export' : 'Email me my data'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
