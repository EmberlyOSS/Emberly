'use client'

import { useEffect, useRef, useState } from 'react'
import { Handshake, Users } from 'lucide-react'
import { Badge } from '@/packages/components/ui/badge'

type Partner = {
  id: string
  name: string
  tagline?: string
  imageUrl?: string
}

type Props = {
  partners?: Partner[]
}

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  )
}

export default function PartnersCarousel({ partners }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    let last = performance.now()
    const speed = 50 // pixels per second (slightly slower for better viewing)

    function frame(now: number) {
      const dt = Math.min(100, now - last) / 1000
      last = now
      if (!pausedRef.current && scrollerRef.current) {
        const scrollEl = scrollerRef.current
        const half = scrollEl.scrollWidth / 2
        scrollEl.scrollLeft = (scrollEl.scrollLeft + speed * dt) % half
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // No longer needed: click-outside listener removed as per user request

  function pause() {
    pausedRef.current = true
    setPaused(true)
  }

  function resume() {
    pausedRef.current = false
    setPaused(false)
  }

  function handleEnter(baseIdx: number) {
    setActiveIndex(baseIdx)
    setExpandedIndex(null)
    pause()
  }

  function handleLeave() {
    setActiveIndex(null)
    if (expandedIndex === null) resume()
  }

  function handleGlobalLeave() {
    setActiveIndex(null)
    setExpandedIndex(null)
    resume()
  }

  function handleToggleExpand(baseIdx: number, event: React.MouseEvent | React.TouchEvent) {
    if (expandedIndex === baseIdx) {
      setExpandedIndex(null)
      setActiveIndex(null)
      setTooltipPosition(null)
      resume()
    } else {
      // Calculate position for tooltip
      const button = event.currentTarget as HTMLElement
      const rect = button.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()

      if (containerRect) {
        setTooltipPosition({
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.bottom - containerRect.top + 8,
        })
      }

      setExpandedIndex(baseIdx)
      setActiveIndex(baseIdx)
      pause()
    }
  }

  const list = partners || []
  const doubled = [...list, ...list]
  const count = list.length
  const expandedPartner = expandedIndex !== null ? list[expandedIndex] : null

  return (
    <GlassCard className="overflow-visible">
      <div ref={containerRef} className="p-6 md:p-8 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Handshake className="h-3 w-3 mr-1" />
              Partners
            </Badge>
            <h3 className="text-2xl font-bold">Trusted by Amazing Teams</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{count} partners and growing</span>
          </div>
        </div>

        {/* Carousel Container with gradient masks */}
        <div className="relative">
          {/* Left fade mask */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background/80 to-transparent z-10 pointer-events-none rounded-l-xl" />

          {/* Right fade mask */}
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background/80 to-transparent z-10 pointer-events-none rounded-r-xl" />

          <div
            ref={scrollerRef}
            className="flex gap-4 items-center whitespace-nowrap overflow-hidden py-6 px-2"
            onMouseLeave={handleGlobalLeave}
            onPointerLeave={handleGlobalLeave}
          >
            {doubled.map((p, idx) => {
              const baseIdx = count > 0 ? idx % count : 0
              const isActive = activeIndex === baseIdx
              const isExpanded = expandedIndex === baseIdx

              return (
                <button
                  key={`${p.id}-${idx}`}
                  type="button"
                  aria-expanded={isExpanded}
                  aria-label={`Partner ${p.name}`}
                  className={`group relative inline-flex items-center gap-4 px-4 py-3 rounded-xl min-w-[140px] flex-shrink-0 transition-all duration-300 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${isExpanded
                    ? 'bg-background/80 border border-primary/30 shadow-lg shadow-primary/10 scale-105 z-40'
                    : isActive
                      ? 'bg-background/60 border border-border/50 scale-102'
                      : 'bg-background/30 border border-transparent hover:bg-background/50 hover:border-border/30'
                    }`}
                  onPointerEnter={() => handleEnter(baseIdx)}
                  onPointerLeave={() => handleLeave()}
                  onClick={(e) => handleToggleExpand(baseIdx, e)}
                  onTouchStart={() => handleEnter(baseIdx)}
                  onTouchEnd={(e) => handleToggleExpand(baseIdx, e)}
                >
                  {/* Logo Container */}
                  <div
                    className={`relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'w-16 h-16' : 'w-12 h-12'
                      }`}
                  >
                    {/* Glow effect on hover/active */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl blur-md transition-opacity duration-300 ${isActive || isExpanded ? 'opacity-100' : 'opacity-0'}`} />

                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={`${p.name} logo`}
                        loading="lazy"
                        className="relative w-full h-full object-contain bg-background rounded-lg p-1"
                      />
                    ) : (
                      <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-lg rounded-lg">
                        {p.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                    )}
                  </div>

                  {/* Partner Name (always visible) */}
                  <div className={`text-left transition-opacity duration-200 ${isExpanded ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="font-medium text-sm truncate max-w-[100px]">{p.name}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Expanded Info Tooltip - rendered outside scroll container to avoid clipping */}
        {expandedPartner && tooltipPosition && (
          <div
            className="absolute z-50 transition-all duration-200 pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-xl shadow-black/20 min-w-[200px] max-w-[280px]">
              <div className="font-semibold text-base">{expandedPartner.name}</div>
              {expandedPartner.tagline && (
                <div className="text-sm text-muted-foreground mt-1 whitespace-normal">
                  {expandedPartner.tagline}
                </div>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-background/95 border-l border-t border-border/50 rotate-45" />
          </div>
        )}
      </div>
    </GlassCard>
  )
}
