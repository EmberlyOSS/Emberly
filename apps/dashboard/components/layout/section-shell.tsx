'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ScrollIndicator } from '@/components/ui/scroll-indicator'

export interface SectionNavItem {
  href: string
  label: string
  icon: React.ElementType
}

export interface SectionNavGroup {
  /** Optional small heading above the group in the sidebar */
  label?: string
  items: SectionNavItem[]
}

export interface SectionShellProps {
  children: React.ReactNode
  /** Name of the area, shown at the top of the sidebar (e.g. "Dashboard") */
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
 * Shared layout for the dashboard and admin areas: a sticky grouped sidebar on
 * desktop, a horizontal strip on mobile, and a consistent page title row.
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
  const ActiveIcon = items.find((i) => i.href === activeHref)?.icon

  const linkClass = (active: boolean) =>
    `flex items-center gap-2.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-secondary text-foreground font-medium'
        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
    }`

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="shrink-0 lg:sticky lg:top-28 lg:w-56">
        {/* Mobile: one scrollable strip */}
        <ScrollIndicator className="lg:hidden glass-card p-1.5">
          <nav className="flex w-max gap-1" aria-label={sectionLabel}>
            {items.map((item) => {
              const active = item.href === activeHref
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`${linkClass(active)} whitespace-nowrap px-3 py-2`}
                >
                  <item.icon
                    className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </ScrollIndicator>

        {/* Desktop: grouped sidebar */}
        <nav
          className="hidden lg:block glass-card p-2 space-y-3"
          aria-label={sectionLabel}
        >
          <p className="px-3 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {sectionLabel}
          </p>
          {groups.map((group, i) => (
            <div key={group.label ?? i} className="space-y-0.5">
              {group.label && (
                <p className="px-3 pb-1 text-xs font-medium text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const active = item.href === activeHref
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`${linkClass(active)} px-3 py-2`}
                  >
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`}
                    />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        {header}
        {title && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {ActiveIcon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <ActiveIcon className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
