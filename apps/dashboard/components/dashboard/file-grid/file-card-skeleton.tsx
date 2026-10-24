import React from 'react'

export function FileCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/80 shadow-sm">
      <div className="aspect-square animate-pulse bg-muted/30" />
      <div className="flex items-center gap-2 border-t border-border/40 px-3 py-2.5">
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted/50" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted/40" />
        </div>
        <div className="h-8 w-8 animate-pulse rounded bg-muted/40" />
      </div>
    </div>
  )
}
