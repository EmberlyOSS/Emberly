import Link from 'next/link'

import { cn } from '@/lib/utils'

/** A titled card section. Pages use these under the shell's page title. */
export function Panel({
  title,
  description,
  actions,
  children,
  flush = false,
  className,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  /** Drop the body padding, e.g. for tables that run edge to edge */
  flush?: boolean
  className?: string
}) {
  const hasHeader = title || description || actions
  return (
    <section className={cn('glass-card overflow-hidden', className)}>
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
          <div className="min-w-0 space-y-0.5">
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={cn(!flush && 'p-5')}>{children}</div>
    </section>
  )
}

export interface FilterOption<T extends string> {
  value: T
  label: string
  count?: number
}

/** Segmented filter control with sentence-case labels and optional counts. */
export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: FilterOption<T>[]
  label?: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'inline-flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-background/40 p-0.5',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors',
              active
                ? 'bg-secondary font-medium text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  active ? 'bg-primary/15 text-primary' : 'bg-muted/60'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** The same control as FilterTabs, for filters kept in the URL. */
export function LinkTabs({
  options,
  label,
  className,
}: {
  options: Array<{
    href: string
    label: string
    active: boolean
    count?: number
  }>
  label?: string
  className?: string
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        'inline-flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-background/40 p-0.5',
        className
      )}
    >
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.active ? 'page' : undefined}
          className={cn(
            'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors',
            option.active
              ? 'bg-secondary font-medium text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-1.5 text-xs tabular-nums',
                option.active ? 'bg-primary/15 text-primary' : 'bg-muted/60'
              )}
            >
              {option.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  )
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
}

const STAT_TONES = {
  default: 'text-foreground',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-rose-500',
} as const

export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: keyof typeof STAT_TONES
}) {
  return (
    <div className="glass-card px-4 py-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          STAT_TONES[tone]
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ElementType
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        className
      )}
    >
      <Icon className="mb-3 h-8 w-8 text-muted-foreground/50" />
      <p className="font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

const BADGE_TONES = {
  neutral: 'border-border bg-muted/40 text-muted-foreground',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-500',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  danger: 'border-rose-500/30 bg-rose-500/10 text-rose-500',
} as const

export type BadgeTone = keyof typeof BADGE_TONES

export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        BADGE_TONES[tone]
      )}
    >
      {children}
    </span>
  )
}
