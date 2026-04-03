'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Skeleton } from '@/packages/components/ui/skeleton'
import { Icons } from '@/packages/components/shared/icons'
import { useToast } from '@/packages/hooks/use-toast'

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

  return (
    <div className="space-y-8">
      {/* Re-check button */}
      <div className="flex justify-end">
        <Button
          onClick={refreshPerks}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isRefreshing ? (
            <>
              <Icons.spinner className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <Icons.refresh className="h-4 w-4" />
              Re-check Perks
            </>
          )}
        </Button>
      </div>
      {/* Active Perks */}
      {activePerks.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Active Perks</h3>
            <p className="text-sm text-muted-foreground">
              Your currently unlocked perks and their benefits
            </p>
          </div>

          <div className="space-y-3">
            {activePerks.map((perk, idx) => (
              <div
                key={idx}
                className="relative p-4 sm:p-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm overflow-hidden group hover:border-primary/50 transition-colors"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative flex flex-col sm:flex-row items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">
                    {perk.icon}
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-base">{perk.name}</h4>
                          {perk.level && (
                            <Badge variant="outline" className="text-xs font-medium border-primary/30 bg-primary/5">
                              Level {perk.level}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {perk.description}
                        </p>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
                        <Icons.check className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>

                    {/* Benefits */}
                    {perk.benefits.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Benefits
                        </div>
                        <ul className="space-y-1.5">
                          {perk.benefits.map((benefit, bidx) => (
                            <li key={bidx} className="flex items-start gap-2 text-sm">
                              <Icons.sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Progress bar if applicable */}
                    {perk.progress && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Progress to next level
                          </span>
                          <span className="font-medium">
                            {perk.progress.current} / {perk.progress.next} {perk.progress.unit}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (perk.progress.current / perk.progress.next) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Earned date */}
                    {perk.earnedAt && (
                      <div className="text-xs text-muted-foreground pt-1">
                        Unlocked {new Date(perk.earnedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Perks */}
      {availablePerks.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Available Perks</h3>
            <p className="text-sm text-muted-foreground">
              Unlock these perks by completing the requirements
            </p>
          </div>

          <div className="space-y-3">
            {availablePerks.map((perk, idx) => (
              <div
                key={idx}
                className="p-6 glass-subtle opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-start gap-4">
                  {/* Icon (grayscale) */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center text-2xl grayscale">
                    {perk.icon}
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-base">{perk.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {perk.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-border/50 text-muted-foreground">
                        Locked
                      </Badge>
                    </div>

                    {/* Benefits */}
                    {perk.benefits.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          What you'll get
                        </div>
                        <ul className="space-y-1.5">
                          {perk.benefits.map((benefit, bidx) => (
                            <li key={bidx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Icons.sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-50" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activePerks.length === 0 && availablePerks.length === 0 && (
        <div className="text-center py-12 rounded-xl border border-dashed border-border">
          <div className="text-4xl mb-4">🎁</div>
          <h3 className="text-lg font-semibold mb-2">No Perks Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Link your GitHub or Discord accounts in the Profile tab to unlock exclusive perks and bonuses!
          </p>
        </div>
      )}
    </div>
  )
}
