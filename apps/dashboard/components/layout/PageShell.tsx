import React from 'react'

import HomeShell from '@/components/layout/home-shell'

interface PageShellProps {
  /** Small label above the title, e.g. "Resources" */
  eyebrow?: string
  title?: string
  subtitle?: React.ReactNode
  /** Buttons etc. aligned to the right of the title on wide screens */
  actions?: React.ReactNode
  children: React.ReactNode
}

/**
 * Standard content page (blog, legal, changelogs…): the marketing background,
 * a plain page header, and the page body.
 */
export default function PageShell({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: PageShellProps) {
  return (
    <HomeShell>
      <div className="space-y-8">
        {title && (
          <header className="flex flex-col gap-4 border-b border-border/60 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-3">
              {eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {eyebrow}
                </p>
              )}
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
          </header>
        )}
        {children}
      </div>
    </HomeShell>
  )
}
