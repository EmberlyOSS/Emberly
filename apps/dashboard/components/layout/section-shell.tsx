'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface SectionNavItem {
  href: string
  label: string
  icon: React.ElementType
}

export interface SectionNavGroup {
  /** Optional name for the group, used as an accessible label */
  label?: string
  items: SectionNavItem[]
}

export interface SectionBarItem {
  key: string
  label: string
  icon: React.ElementType
  href?: string
  onSelect?: () => void
}

/**
 * The sticky row of section tabs under the site navbar, shared by the
 * dashboard, admin and profile areas. Groups are separated by thin dividers.
 */
export function SectionBar({
  label,
  groups,
  activeKey,
}: {
  label: string
  groups: Array<{ label?: string; items: SectionBarItem[] }>
  activeKey?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLElement | null>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 1)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    // Let a vertical mouse wheel scroll the tabs sideways
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('scroll', update)
      el.removeEventListener('wheel', onWheel)
      observer.disconnect()
    }
  }, [update])

  // Keep the active tab in view without moving the page vertically
  useEffect(() => {
    const el = scrollRef.current
    const active = activeRef.current
    if (!el || !active) return
    const left = active.offsetLeft - el.clientWidth / 2 + active.offsetWidth / 2
    el.scrollTo({ left: Math.max(0, left) })
  }, [activeKey])

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollRef.current
    if (el)
      el.scrollBy({
        left: direction * el.clientWidth * 0.7,
        behavior: 'smooth',
      })
  }

  const itemClass = (active: boolean) =>
    cn(
      'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors',
      active
        ? 'bg-secondary font-medium text-foreground'
        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
    )

  const arrowClass =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'

  return (
    <div className="sticky top-24 z-30 -mx-1 px-1">
      <div className="glass-elevated flex items-center gap-1 rounded-xl p-1.5">
        {canLeft && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className={arrowClass}
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="relative min-w-0 flex-1 overflow-x-auto scrollbar-none"
        >
          <nav aria-label={label} className="flex w-max items-center gap-1">
            {groups.map((group, gi) => (
              <div
                key={group.label ?? gi}
                role="group"
                aria-label={group.label}
                className="flex items-center gap-1"
              >
                {gi > 0 && (
                  <span aria-hidden className="mx-1 h-5 w-px bg-border" />
                )}
                {group.items.map((item) => {
                  const active = item.key === activeKey
                  const setRef = active
                    ? (el: HTMLElement | null) => void (activeRef.current = el)
                    : undefined
                  const content = (
                    <>
                      <item.icon
                        className={cn('h-4 w-4', active && 'text-primary')}
                      />
                      {item.label}
                    </>
                  )
                  return item.href ? (
                    <Link
                      key={item.key}
                      href={item.href}
                      ref={setRef}
                      aria-current={active ? 'page' : undefined}
                      className={itemClass(active)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.onSelect}
                      ref={setRef}
                      aria-current={active ? 'page' : undefined}
                      className={itemClass(active)}
                    >
                      {content}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
        </div>
        {canRight && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className={arrowClass}
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export interface SectionShellProps {
  children: React.ReactNode
  /** Name of the area, e.g. "Dashboard", used to label the section bar */
  sectionLabel: string
  groups: SectionNavGroup[]
  /** Page title shown above the content, with the active item's icon */
  title?: string
  description?: React.ReactNode
  /** Buttons etc. aligned to the right of the title */
  actions?: React.ReactNode
  /** Fully custom header, for pages that need more than a title */
  header?: React.ReactNode
}

/**
 * Shared layout for the dashboard and admin areas: a sticky section bar, then
 * a page title row, then the page at full width.
 */
export function SectionShell({
  children,
  sectionLabel,
  groups,
  title,
  description,
  actions,
  header,
}: SectionShellProps) {
  const pathname = usePathname()
  const items = groups.flatMap((g) => g.items)

  // Most specific match wins, so a root like /dashboard doesn't claim every page
  const activeHref = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(i.href + '/'))?.href

  return (
    <div className="space-y-6">
      <SectionBar
        label={sectionLabel}
        activeKey={activeHref}
        groups={groups.map((g) => ({
          label: g.label,
          items: g.items.map((i) => ({ ...i, key: i.href })),
        }))}
      />

      {header}
      {title && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
