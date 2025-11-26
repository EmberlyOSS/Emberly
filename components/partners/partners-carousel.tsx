'use client'

import { useEffect, useRef, useState } from 'react'

type Partner = {
  id: string
  name: string
  tagline?: string
  imageUrl?: string
}

const PARTNERS: Partner[] = [
  {
    id: 'p1',
    name: 'NodeByte',
    tagline: 'Web Hosting Solutions',
    imageUrl: '/partners/NodeByte.png',
  },
  {
    id: 'p2',
    name: 'Purrquinox',
    tagline: 'Technology Company',
    imageUrl: '/partners/Purrquinox.png',
  },
  {
    id: 'p3',
    name: 'VeloxVPN',
    tagline: 'Internet Privacy',
    imageUrl: '/partners/VeloxVPN.png',
  },
  {
    id: 'p4',
    name: 'Octoflow',
    tagline: 'Git Tools',
    imageUrl: '/partners/Octoflow.png',
  },
  {
    id: 'p5',
    name: 'Lexicon',
    tagline: 'Grammar Assistance',
    imageUrl: '/partners/Lexicon.png',
  },
  {
    id: 'p6',
    name: 'Lynkr',
    tagline: 'Link-In-Bio Solutions',
    imageUrl: '/partners/Lynkr.png',
  },
  {
    id: 'p7',
    name: 'Planova',
    tagline: 'Project Management',
    imageUrl: '/partners/Planova.png',
  },
  {
    id: 'p8',
    name: 'Cryptica',
    tagline: 'Password Management',
    imageUrl: '/partners/Cryptica.png',
  },
]

export default function PartnersCarousel() {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const pausedRef = useRef(false)

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  // --- Auto scroll ---
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    let last = performance.now()
    const speed = 60

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

  function pause() {
    pausedRef.current = true
  }

  function resume() {
    if (expandedIndex === null && activeIndex === null) {
      pausedRef.current = false
    }
  }

  function handleEnter(i: number) {
    setActiveIndex(i)
    pause()
  }

  function handleLeave() {
    setActiveIndex(null)
    if (expandedIndex === null) resume()
  }

  function handleToggleExpand(i: number) {
    if (expandedIndex === i) {
      setExpandedIndex(null)
      setActiveIndex(null)
      resume()
    } else {
      setExpandedIndex(i)
      setActiveIndex(i)
      pause()
    }
  }

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
        onMouseLeave={resume}
      >
        {[...PARTNERS, ...PARTNERS].map((p, idx) => {
          const baseIdx = idx % PARTNERS.length
          const isActive = activeIndex === baseIdx
          const isExpanded = expandedIndex === baseIdx

          return (
            <div
              key={`${p.id}-${idx}`}
              onMouseEnter={() => handleEnter(baseIdx)}
              onMouseLeave={handleLeave}
              onClick={() => handleToggleExpand(baseIdx)}
              className={`inline-flex flex-col items-center px-4 py-3 rounded-lg min-w-[140px] flex-shrink-0 cursor-pointer transition-all duration-300
                ${isExpanded ? 'bg-background/60 border border-border/60 shadow-lg scale-105' : ''}
              `}
            >
              {/* LOGO */}
              <div
                className={`rounded-md overflow-hidden transition-all duration-300 
                  ${isExpanded ? 'w-20 h-20' : 'w-16 h-16'}
                `}
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={`${p.name} logo`}
                    loading="lazy"
                    className="w-full h-full object-contain"
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

              {/* TEXT BELOW */}
              <div
                className={`mt-3 text-center transition-all duration-300
                  ${isExpanded || isActive ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'}
                  overflow-hidden
                `}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.tagline}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
