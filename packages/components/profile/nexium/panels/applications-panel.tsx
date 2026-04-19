'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import { useToast } from '@/packages/hooks/use-toast'
import { Loader2, Send } from 'lucide-react'
import {
  NEXIUM_APPLICATION_STATUS_LABELS,
  NEXIUM_OPPORTUNITY_TYPE_LABELS,
} from '@/packages/lib/nexium/constants'
import { APP_STATUS_STYLE } from '../constants'
import type { MyApplication } from '../types'

export function ApplicationsPanel() {
  const [apps, setApps] = useState<MyApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch('/api/discovery/applications')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setApps(json.data?.applications ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load applications', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchApps() }, [fetchApps])

  const withdraw = async (opportunityId: string) => {
    setWithdrawing(opportunityId)
    try {
      const res = await fetch(`/api/discovery/opportunities/${opportunityId}/apply`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to withdraw')
      }
      setApps((prev) =>
        prev.map((a) => a.opportunity.id === opportunityId ? { ...a, status: 'WITHDRAWN' } : a)
      )
      toast({ title: 'Application withdrawn' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setWithdrawing(null)
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading applications…
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="py-8 text-center space-y-2">
        <Send className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-sm font-medium">No applications yet</p>
        <p className="text-xs text-muted-foreground">Browse opportunities and apply to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {apps.length} application{apps.length !== 1 ? 's' : ''}
      </p>
      {apps.map((app) => (
        <div key={app.id} className="p-4 rounded-lg border border-border bg-background space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{app.opportunity.title}</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${APP_STATUS_STYLE[app.status] ?? ''}`}
                >
                  {NEXIUM_APPLICATION_STATUS_LABELS[app.status as keyof typeof NEXIUM_APPLICATION_STATUS_LABELS]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span>{NEXIUM_OPPORTUNITY_TYPE_LABELS[app.opportunity.type as keyof typeof NEXIUM_OPPORTUNITY_TYPE_LABELS]}</span>
                {app.opportunity.remote
                  ? <span>Remote</span>
                  : app.opportunity.location && <span>{app.opportunity.location}</span>
                }
                <span>by @{app.opportunity.postedBy.name}</span>
                <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
              </div>
              {app.message && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 italic">
                  &ldquo;{app.message}&rdquo;
                </p>
              )}
            </div>
            {(app.status === 'PENDING' || app.status === 'VIEWED') && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-destructive shrink0"
                disabled={withdrawing === app.opportunity.id}
                onClick={() => withdraw(app.opportunity.id)}
              >
                {withdrawing === app.opportunity.id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : 'Withdraw'
                }
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
