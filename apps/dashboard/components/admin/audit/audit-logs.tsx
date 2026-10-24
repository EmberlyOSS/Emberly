'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
} from 'date-fns'
import {
  ChevronDown,
  CreditCard,
  FileText,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserCog,
  UserRound,
} from 'lucide-react'

import {
  EmptyState,
  FilterTabs,
  StatusBadge,
} from '@/components/layout/page-kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { cn } from '@/lib/utils'
import { describeDevice } from '@/lib/utils/user-agent'

import { useDebounce } from '@/hooks/use-debounce'

type AuditLog = {
  id: string
  type: string
  status: string
  action: string | null
  resource: string | null
  success: boolean | null
  error: string | null
  payload: unknown
  metadata: unknown
  failedAt: string | null
  retryCount: number | null
  maxRetries: number | null
  actorId: string | null
  actorEmail: string | null
  targetId: string | null
  targetEmail: string | null
  ip: string | null
  userAgent: string | null
  geo: { country?: string; region?: string; city?: string } | null
  createdAt: string
}

const AREAS = [
  { value: 'all', label: 'All' },
  { value: 'auth', label: 'Sign-ins' },
  { value: 'account', label: 'Account' },
  { value: 'security', label: 'Security' },
  { value: 'admin', label: 'Admin' },
  { value: 'billing', label: 'Billing' },
  { value: 'file', label: 'Files' },
] as const
type Area = (typeof AREAS)[number]['value']

const AREA_ICONS: Record<string, React.ElementType> = {
  auth: KeyRound,
  account: UserRound,
  security: ShieldAlert,
  admin: UserCog,
  billing: CreditCard,
  file: FileText,
}

const PERIODS = [
  { value: '24h', label: 'Last 24 hours', days: 1 },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: 'all', label: 'All time', days: 0 },
] as const
type Period = (typeof PERIODS)[number]['value']

const EVENT_LABELS: Record<string, string> = {
  'auth.login': 'signed in',
  'auth.logout': 'signed out',
  'auth.password-changed': 'changed their password',
  'auth.password-reset-requested': 'asked to reset their password',
  'auth.password-reset-completed': 'reset their password',
  'auth.2fa-enabled': 'turned on two-factor authentication',
  'auth.2fa-disabled': 'turned off two-factor authentication',
  'auth.session-revoked': 'signed out everywhere',
  'account.created': 'created an account',
  'account.profile-updated': 'updated their profile',
  'account.email-changed': 'changed their email address',
  'account.email-verified': 'verified their email address',
  'account.export-requested': 'requested a data export',
  'account.export-completed': 'received their data export',
  'account.deletion-requested': 'asked to delete their account',
  'account.deletion-cancelled': 'cancelled deleting their account',
  'account.deleted': 'deleted their account',
  'security.api-key-created': 'created an API key',
  'security.api-key-revoked': 'revoked an API key',
  'security.suspicious-activity': 'triggered a suspicious activity alert',
  'security.rate-limit-exceeded': 'hit a rate limit',
  'admin.user-role-changed': 'changed the role of',
  'admin.user-banned': 'banned',
  'admin.user-unbanned': 'unbanned',
  'admin.user-suspended': 'suspended',
  'admin.user-unsuspended': 'unsuspended',
  'admin.content-removed': 'removed content from',
  'admin.broadcast-sent': 'sent an announcement',
  'billing.subscription-created': 'subscribed',
  'billing.subscription-updated': 'changed their plan',
  'billing.subscription-cancelled': 'cancelled their subscription',
  'billing.payment-succeeded': 'made a payment',
  'billing.payment-failed': 'had a payment fail',
  'billing.refund-issued': 'was refunded',
}

function describeEvent(log: AuditLog) {
  if (EVENT_LABELS[log.type]) return EVENT_LABELS[log.type]
  const action = (log.action || log.type.split('.').slice(1).join(' '))
    .replace(/[-_.]/g, ' ')
    .toLowerCase()
  return action || 'did something'
}

function areaOf(log: AuditLog) {
  return (log.resource || log.type.split('.')[0] || '').toLowerCase()
}

function place(log: AuditLog) {
  const parts = [log.geo?.city, log.geo?.country].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

function dayLabel(date: Date) {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

function periodStart(period: Period) {
  const days = PERIODS.find((p) => p.value === period)?.days ?? 0
  return days ? new Date(Date.now() - days * 86_400_000).toISOString() : ''
}

function statusTone(log: AuditLog) {
  if (log.status === 'FAILED' || log.success === false)
    return { tone: 'danger' as const, label: 'Failed' }
  if (log.status === 'PENDING' || log.status === 'SCHEDULED')
    return { tone: 'warning' as const, label: 'Queued' }
  if (log.status === 'PROCESSING')
    return { tone: 'info' as const, label: 'Processing' }
  return null
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2) ?? ''
  } catch {
    return String(value)
  }
}

const LIMIT = 30

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [area, setArea] = useState<Area>('all')
  const [period, setPeriod] = useState<Period>('7d')
  const [showMore, setShowMore] = useState(false)
  const [result, setResult] = useState<'all' | 'true' | 'false'>('all')
  const [scope, setScope] = useState<'auditable' | 'all'>('auditable')

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
    })
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
    if (area !== 'all') params.set('resource', area)
    if (result !== 'all') params.set('success', result)
    if (scope === 'auditable') params.set('auditableOnly', 'true')
    const since = periodStart(period)
    if (since) params.set('startDate', since)
    return params.toString()
  }, [page, debouncedSearch, area, result, scope, period])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    fetch(`/api/admin/audit/logs?${query}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Couldn't load the audit log")
        const body = await res.json()
        if (cancelled) return
        setLogs(body.data || [])
        setPageCount(body.pagination?.pageCount || 1)
        setTotal(body.pagination?.total || 0)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Couldn't load the audit log")
        setLogs([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query, reloadKey])

  const resetPage = () => setPage(1)

  const groups = useMemo(() => {
    const byDay: Array<{ label: string; items: AuditLog[] }> = []
    for (const log of logs) {
      const label = dayLabel(new Date(log.createdAt))
      const last = byDay[byDay.length - 1]
      if (last?.label === label) last.items.push(log)
      else byDay.push({ label, items: [log] })
    }
    return byDay
  }, [logs])

  const moreActive = result !== 'all' || scope !== 'auditable'

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <FilterTabs
          value={area}
          onChange={(value) => {
            setArea(value)
            resetPage()
          }}
          options={AREAS.map((a) => ({ value: a.value, label: a.label }))}
          label="Area"
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPage()
              }}
              placeholder="Search by email, IP or event"
              aria-label="Search the audit log"
              className="h-9 border-border/50 bg-background/50 pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={period}
              onValueChange={(value) => {
                setPeriod(value as Period)
                resetPage()
              }}
            >
              <SelectTrigger
                className="h-9 w-full border-border/50 bg-background/50 sm:w-40"
                aria-label="Time period"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className={cn('h-9 shrink-0', moreActive && 'border-primary/50')}
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
            >
              <SlidersHorizontal className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setReloadKey((k) => k + 1)}
              aria-label="Refresh"
            >
              <RefreshCw
                className={cn('h-4 w-4', isLoading && 'animate-spin')}
              />
            </Button>
          </div>
        </div>

        {showMore && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/10 p-2">
            <FilterTabs
              value={result}
              onChange={(value) => {
                setResult(value)
                resetPage()
              }}
              options={[
                { value: 'all', label: 'Any result' },
                { value: 'true', label: 'Succeeded' },
                { value: 'false', label: 'Failed' },
              ]}
              label="Result"
            />
            <FilterTabs
              value={scope}
              onChange={(value) => {
                setScope(value)
                resetPage()
              }}
              options={[
                { value: 'auditable', label: 'Audit events' },
                { value: 'all', label: 'Everything' },
              ]}
              label="Scope"
            />
          </div>
        )}
      </div>

      <section className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3 text-sm text-muted-foreground">
          <span>
            {isLoading && !logs.length
              ? 'Loading…'
              : `${total.toLocaleString()} ${total === 1 ? 'event' : 'events'}`}
          </span>
          {pageCount > 1 && (
            <span>
              Page {page} of {pageCount}
            </span>
          )}
        </div>

        {error ? (
          <p className="px-5 py-10 text-center text-sm text-destructive">
            {error}
          </p>
        ) : isLoading && !logs.length ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Nothing here"
            description="No events match these filters."
          />
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <p className="border-b border-border/40 bg-muted/30 px-5 py-1.5 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              <ul className="divide-y divide-border/40">
                {group.items.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    open={openId === log.id}
                    onToggle={() =>
                      setOpenId((id) => (id === log.id ? null : log.id))
                    }
                  />
                ))}
              </ul>
            </div>
          ))
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-between gap-2 border-t border-border/50 px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Newer
            </Button>
            <span className="text-sm text-muted-foreground">
              {(page - 1) * LIMIT + 1}–{(page - 1) * LIMIT + logs.length} of{' '}
              {total.toLocaleString()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= pageCount || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Older
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

function LogRow({
  log,
  open,
  onToggle,
}: {
  log: AuditLog
  open: boolean
  onToggle: () => void
}) {
  const Icon = AREA_ICONS[areaOf(log)] ?? ShieldAlert
  const status = statusTone(log)
  const when = new Date(log.createdAt)
  const device = describeDevice(log.userAgent)
  const where = place(log)
  const actor = log.actorEmail || (log.actorId ? 'A user' : 'System')
  const target = log.targetEmail || log.targetId

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/20"
      >
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            status?.tone === 'danger'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted/60 text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug">
            <span className="break-all font-medium">{actor}</span>{' '}
            <span className="text-muted-foreground">{describeEvent(log)}</span>
            {target && target !== log.actorEmail && (
              <>
                {' '}
                <span className="break-all font-medium">{target}</span>
              </>
            )}
            {status && (
              <span className="ml-2 inline-block align-middle">
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            <time dateTime={log.createdAt} title={format(when, 'PPpp')}>
              {formatDistanceToNowStrict(when, { addSuffix: true })}
            </time>
            {where && ` · ${where}`}
            {device && ` · ${device}`}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'mt-1.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <LogDetails log={log} />}
    </li>
  )
}

function LogDetails({ log }: { log: AuditLog }) {
  const rows: Array<[string, React.ReactNode]> = [
    ['Time', format(new Date(log.createdAt), 'PPpp')],
    [
      'Event',
      <code key="type" className="text-xs">
        {log.type}
      </code>,
    ],
  ]
  if (log.actorEmail || log.actorId)
    rows.push(['By', [log.actorEmail, log.actorId].filter(Boolean).join(' · ')])
  if (log.targetEmail || log.targetId)
    rows.push([
      'Affected',
      [log.targetEmail, log.targetId].filter(Boolean).join(' · '),
    ])
  if (log.ip) rows.push(['IP address', log.ip])
  const where = place(log)
  if (where) rows.push(['Location', where])
  if (log.userAgent) rows.push(['Browser', log.userAgent])
  if (log.error) rows.push(['Error', log.error])
  if (log.retryCount)
    rows.push([
      'Retries',
      `${log.retryCount}${log.maxRetries ? ` of ${log.maxRetries}` : ''}`,
    ])

  const hasPayload =
    log.payload != null &&
    !(
      typeof log.payload === 'object' &&
      !Object.keys(log.payload as object).length
    )

  return (
    <div className="space-y-4 border-t border-border/40 bg-muted/10 px-5 py-4 sm:pl-16">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-xs text-muted-foreground sm:pt-0.5">{label}</dt>
            <dd
              className={cn(
                'mb-2 break-words sm:mb-0',
                label === 'Error' && 'text-destructive',
                label === 'Browser' && 'text-xs text-muted-foreground'
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {hasPayload && (
        <details>
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            Event data
          </summary>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-background/60 p-3 text-xs leading-relaxed">
            {formatJson(log.payload)}
          </pre>
        </details>
      )}
    </div>
  )
}
