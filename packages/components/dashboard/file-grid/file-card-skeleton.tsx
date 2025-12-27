import React from 'react'

export function FileCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white/5 dark:bg-white/[0.02] backdrop-blur-xl border-white/10 dark:border-white/5 shadow-lg shadow-black/5 text-card-foreground relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

      {/* Thumbnail skeleton */}
      <div className="relative">
        <div className="relative aspect-square bg-white/5 dark:bg-white/[0.02] animate-pulse rounded-t-xl overflow-hidden" />

        {/* Hover overlay skeleton */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20 opacity-0 transition-opacity flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 bg-white/10 rounded animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Visibility badge skeleton */}
        <div className="absolute bottom-2 left-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/10">
            <div className="h-3 w-3 bg-white/20 rounded animate-pulse" />
            <div className="h-3 w-12 bg-white/20 rounded animate-pulse" />
          </div>
        </div>

        {/* Timestamp badge skeleton */}
        <div className="absolute bottom-2 right-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/10">
            <div className="h-3 w-3 bg-white/20 rounded animate-pulse" />
            <div className="h-3 w-8 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* File info skeleton */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div className="h-[18px] w-3/4 bg-white/10 rounded animate-pulse" />
          <div className="h-[18px] w-12 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="mt-1.5 flex items-center space-x-3">
          <div className="h-3 w-10 bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-10 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
