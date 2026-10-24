import React from 'react'

import { PaginationInfo } from '@/types/components/file'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

interface FileGridPaginationProps {
  paginationInfo: PaginationInfo
  setPage: (page: number) => void
}

function pageList(page: number, count: number): Array<number | 'gap'> {
  const pages = new Set([1, count, page - 1, page, page + 1])
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= count)
    .sort((a, b) => a - b)
  const out: Array<number | 'gap'> = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap')
    out.push(p)
  })
  return out
}

export function FileGridPagination({
  paginationInfo,
  setPage,
}: FileGridPaginationProps) {
  const { page, pageCount, total, limit } = paginationInfo
  if (pageCount <= 1) return null

  const go = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const first = (page - 1) * limit + 1
  const last = Math.min(page * limit, total)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-4 sm:flex-row"
    >
      <p className="text-sm tabular-nums text-muted-foreground">
        {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pageList(page, pageCount).map((p, i) =>
          p === 'gap' ? (
            <span
              key={`gap-${i}`}
              className="w-6 text-center text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              aria-current={p === page ? 'page' : undefined}
              onClick={() => go(p)}
              className={cn(
                'h-8 min-w-8 px-2 tabular-nums',
                p === page && 'bg-secondary font-medium'
              )}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={page >= pageCount}
          onClick={() => go(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
