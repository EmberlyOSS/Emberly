'use client'

import { useEffect, useRef, useState } from 'react'

type Partner = {
  id: string
  name: string
  tagline?: string
  imageUrl?: string
}

type Props = {
  partners?: Partner[]
}

export default function PartnersCarousel({ partners }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null) // base index within PARTNERS
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    let last = performance.now()
    const speed = 60 // pixels per second

    function frame(now: number) {
      const dt = Math.min(100, now - last) / 1000
      last = now
      if (!pausedRef.current && scrollerRef.current) {
        const scrollEl = scrollerRef.current
        const half = scrollEl.scrollWidth / 2
        // advance by speed * dt and wrap when past half
        scrollEl.scrollLeft = (scrollEl.scrollLeft + speed * dt) % half
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Close expanded/active state and resume when clicking/tapping outside
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null
      const el = scrollerRef.current
      if (!el) return
      if (target && !el.contains(target)) {
        // clicked outside carousel -> collapse any expanded/active and resume
        setExpandedIndex(null)
        setActiveIndex(null)
        pausedRef.current = false
        setPaused(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function pause() {
    pausedRef.current = true
    setPaused(true)
  }

  function resume() {
    // only resume if nothing is expanded/active
    if (expandedIndex === null && activeIndex === null) {
      pausedRef.current = false
      setPaused(false)
    }
  }

  // when an item is hovered/clicked we pause and set active/expanded indices
  function handleEnter(baseIdx: number) {
    setActiveIndex(baseIdx)
    setExpandedIndex(null)
    pause()
  }

  function handleLeave() {
    setActiveIndex(null)
    // don't automatically collapse an expanded item here
    if (expandedIndex === null) resume()
  }

  function handleToggleExpand(baseIdx: number) {
    if (expandedIndex === baseIdx) {
      setExpandedIndex(null)
      setActiveIndex(null)
      resume()
    } else {
      setExpandedIndex(baseIdx)
      setActiveIndex(baseIdx)
      pause()
    }
  }

  const list = partners || []
  const doubled = [...list, ...list]
  const count = list.length

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Our partners</h3>
        <div className="text-sm text-muted-foreground">
          Trusted by teams worldwide
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-6 items-center whitespace-nowrap overflow-hidden py-4"
        onMouseLeave={() => resume()}
        onPointerLeave={() => resume()}
      >
        {doubled.map((p, idx) => {
          const baseIdx = count > 0 ? idx % count : 0
          const isActive = activeIndex === baseIdx
          const isExpanded = expandedIndex === baseIdx

          return (
            <div
              key={`${p.id}-${idx}`}
              className={`inline-flex items-center gap-4 px-3 py-2 rounded-lg min-w-[120px] flex-shrink-0 transition-transform duration-300 ease-in-out cursor-pointer ${isExpanded ? 'bg-background/60 border border-border/60 shadow-lg scale-105 z-40' : 'bg-transparent'} relative overflow-visible`}
              onMouseEnter={() => handleEnter(baseIdx)}
              onMouseLeave={() => handleLeave()}
              onClick={() => handleToggleExpand(baseIdx)}
              onTouchStart={() => handleEnter(baseIdx)}
              onTouchEnd={() => handleToggleExpand(baseIdx)}
            >
              <div
                className={`flex-shrink-0 rounded-md overflow-hidden transition-all duration-300 ${isExpanded ? 'w-20 h-20' : 'w-16 h-16'}`}
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={`${p.name} logo`}
                    loading="lazy"
                    className="w-full h-full object-contain bg-white/0"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {p.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                )}
              </div>

              {/* overlay info shown when expanded or active - positioned absolutely to avoid layout shift */}
              <div
                className={`absolute top-1/2 left-full ml-3 transform -translate-y-1/2 transition-opacity duration-200 pointer-events-auto ${isExpanded ? 'opacity-100 w-[320px] z-50' : isActive ? 'opacity-100 w-[220px] z-30' : 'opacity-0 w-0 overflow-hidden'}`}
              >
                <div
                  className={`bg-background border border-border/50 rounded-lg p-3 shadow`}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.tagline}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
