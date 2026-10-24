'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Icons } from '@/components/shared/icons'
import { useToast } from '@/hooks/use-toast'

interface PerkInfo {
  name: string
  icon: string
  description: string
  benefits: string[]
  active: boolean
  earnedAt?: string
  level?: number
  progress?: {
    current: number
    next: number
    unit: string
  }
}

export function ProfilePerks() {
  const [perks, setPerks] = useState<PerkInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPerks()
  }, [])

  const fetchPerks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/profile/perks')
      if (!response.ok) throw new Error('Failed to fetch perks')

      const data = await response.json()
      setPerks(data.perks || [])
    } catch (error) {
      console.error('Failed to fetch perks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load perks. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshPerks = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/profile/perks/refresh', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to refresh perks')

      await response.json()

      // Refetch perks to show updated data
      await fetchPerks()
      toast({
        title: 'Perks updated',
        description: 'Your perk status has been refreshed',
      })
    } catch (error) {
      console.error('Failed to refresh perks:', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh perks. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 glass-subtle">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const activePerks = perks.filter((p) => p.active)
  const availablePerks = perks.filter((p) => !p.active)

  const sorted = [...activePerks, ...availablePerks]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {activePerks.length
            ? `${activePerks.length} of ${perks.length} unlocked`
            : 'Link your GitHub or Discord account under Connections to start unlocking perks.'}
        </p>
        <Button
          onClick={refreshPerks}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
        >
          {isRefreshing ? (
            <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Icons.refresh className="h-3.5 w-3.5" />
          )}
          Check again
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No perks are available yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
          {sorted.map((perk, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-4 px-4 py-4 ${perk.active ? '' : 'opacity-70'}`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl ${perk.active ? 'bg-primary/10' : 'bg-muted grayscale'}`}
              >
                {perk.icon}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{perk.name}</span>
                  {perk.level && (
                    <span className="text-xs text-muted-foreground">
                      Level {perk.level}
                    </span>
                  )}
                  <span
                    className={
                      perk.active
                        ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500'
                        : 'rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground'
                    }
                  >
                    {perk.active ? 'Active' : 'Locked'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {perk.description}
                </p>
                {perk.benefits.length > 0 && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      {perk.active ? 'Gives you: ' : 'Unlocks: '}
                    </span>
                    {perk.benefits.join(' · ')}
                  </p>
                )}
                {perk.progress && (
                  <div className="max-w-sm space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Next level</span>
                      <span>
                        {perk.progress.current} / {perk.progress.next}{' '}
                        {perk.progress.unit}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, (perk.progress.current / perk.progress.next) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {perk.active && perk.earnedAt && (
                  <p className="text-xs text-muted-foreground">
                    Unlocked {new Date(perk.earnedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
