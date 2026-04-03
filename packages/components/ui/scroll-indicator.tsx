'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/packages/lib/utils'

interface ScrollIndicatorProps {
  children: React.ReactNode
  className?: string
}

export function ScrollIndicator({ children, className }: ScrollIndicatorProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const observer = new ResizeObserver(checkScroll)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      observer.disconnect()
    }
  }, [checkScroll])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div ref={scrollRef} className="overflow-x-auto scrollbar-none">
        {children}
      </div>

      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-muted/80 to-transparent pointer-events-none transition-opacity duration-200 flex items-center pl-0.5',
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        )}
      >
        <ChevronLeft className="h-3 w-3 text-muted-foreground" />
      </div>

      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-muted/80 to-transparent pointer-events-none transition-opacity duration-200 flex items-center justify-end pr-0.5',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
      >
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  )
}
