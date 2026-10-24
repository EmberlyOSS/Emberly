'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  Cpu,
  CreditCard,
  Database,
  HardDrive,
  KeyRound,
  ListTodo,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Webhook,
  Zap,
} from 'lucide-react'

import { StatusBadge, type BadgeTone } from '@/components/layout/page-kit'
import { Button } from '@/components/ui/button'

import { formatBytes } from '@/lib/utils'
import { writeToClipboard } from '@/lib/utils/clipboard'

type CheckStatus =
  'up' | 'down' | 'disabled' | 'configured' | 'not_configured' | 'no_worker'

interface HealthCheck {
  status: CheckStatus
  latencyMs?: number
  provider?: string | null
  waiting?: number
  active?: number
  failed?: number
  delayed?: number
  workers?: number
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down'
  version: string
  uptimeSeconds: number
  cloud: boolean
  warnings?: string[]
  checks: {
    database: HealthCheck
    redis: HealthCheck
    storage: HealthCheck
    virusScanning: HealthCheck
    eventQueue: HealthCheck
    stripe?: HealthCheck
  }
}

interface SystemInfo {
  version: string
  runtime: {
    bun: string | null
    node: string
    platform: string
    environment: string
    cloud: boolean
    processUptimeSeconds: number
    memoryMb: number
    inProcessWorker: boolean
  }
  database: { version: string | null; latestMigration: string | null }
  storage: {
    provider: string
    disk: { freeBytes: number; totalBytes: number } | null
  }
  email: { provider: string; configured: boolean }
  discordAlerts: { configured: boolean }
  license: {
    state: string
    licensee?: string
    features?: string[]
    expiresAt?: string | null
  }
}

const STATUS: Record<CheckStatus, { tone: BadgeTone; label: string }> = {
  up: { tone: 'success', label: 'Up' },
  configured: { tone: 'success', label: 'Set up' },
  down: { tone: 'danger', label: 'Down' },
  not_configured: { tone: 'neutral', label: 'Not set up' },
  disabled: { tone: 'neutral', label: 'Off' },
  no_worker: { tone: 'warning', label: 'No worker' },
}

const OVERALL = {
  ok: { tone: 'success' as const, label: 'All systems working' },
  degraded: { tone: 'warning' as const, label: 'Needs attention' },
  down: { tone: 'danger' as const, label: 'Down' },
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function Tile({
  icon: Icon,
  label,
  badge,
  children,
}: {
  icon: React.ElementType
  label: string
  badge?: { tone: BadgeTone; label: string }
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border/50 bg-muted/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        {badge && <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>}
      </div>
      {children && (
        <div className="space-y-0.5 text-xs text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  )
}

function licenseBadge(state: string): { tone: BadgeTone; label: string } {
  if (state === 'valid') return { tone: 'success', label: 'Active' }
  if (state === 'none') return { tone: 'neutral', label: 'None' }
  return { tone: 'danger', label: capitalize(state.replace('-', ' ')) }
}

function buildDebugInfo(
  health: HealthResponse | null,
  info: SystemInfo | null
) {
  const c = health?.checks
  const line = (label: string, value: string | null | undefined) =>
    value ? `- **${label}:** ${value}` : null
  const status = (check?: HealthCheck) =>
    check
      ? [
          STATUS[check.status]?.label ?? check.status,
          typeof check.latencyMs === 'number' ? `${check.latencyMs}ms` : null,
        ]
          .filter(Boolean)
          .join(', ')
      : null
  const disk = info?.storage.disk
  return [
    '### Emberly debug info',
    line(
      'Version',
      `${health?.version ?? info?.version ?? '?'} (${info?.runtime.environment ?? '?'}, ${health?.cloud ? 'cloud' : 'self-hosted'})`
    ),
    line('Overall', health ? OVERALL[health.status].label : 'unknown'),
    line(
      'Runtime',
      info
        ? `${info.runtime.bun ? `Bun ${info.runtime.bun}, ` : ''}Node ${info.runtime.node}, ${info.runtime.platform}`
        : null
    ),
    line(
      'Server',
      info
        ? `up ${formatUptime(info.runtime.processUptimeSeconds)}, ${info.runtime.memoryMb} MB memory, in-app worker ${info.runtime.inProcessWorker ? 'on' : 'off'}`
        : null
    ),
    line(
      'Database',
      [
        status(c?.database),
        info?.database.version && `PostgreSQL ${info.database.version}`,
        info?.database.latestMigration &&
          `latest migration ${info.database.latestMigration}`,
      ]
        .filter(Boolean)
        .join(', ')
    ),
    line('Redis', status(c?.redis)),
    line(
      'Storage',
      [
        c?.storage.provider ?? info?.storage.provider,
        status(c?.storage),
        disk &&
          `${formatBytes(disk.freeBytes)} free of ${formatBytes(disk.totalBytes)}`,
      ]
        .filter(Boolean)
        .join(', ')
    ),
    line(
      'Event queue',
      c?.eventQueue
        ? `${status(c.eventQueue)}, ${c.eventQueue.workers ?? 0} workers, ${c.eventQueue.waiting ?? 0} waiting, ${c.eventQueue.failed ?? 0} failed`
        : null
    ),
    line('Virus scanning', status(c?.virusScanning)),
    line('Stripe', status(c?.stripe)),
    line(
      'Email',
      info
        ? `${info.email.provider === 'smtp' ? 'SMTP' : 'Resend'}, ${info.email.configured ? 'set up' : 'not set up'}`
        : null
    ),
    line(
      'Discord alerts',
      info ? (info.discordAlerts.configured ? 'set up' : 'not set up') : null
    ),
    line(
      'License',
      info
        ? [info.license.state, info.license.features?.join('/')]
            .filter(Boolean)
            .join(', ')
        : null
    ),
    line(
      'Warnings',
      health?.warnings?.length ? health.warnings.join(' / ') : null
    ),
    line(
      'Browser',
      typeof navigator !== 'undefined' ? navigator.userAgent : null
    ),
    line('Captured', new Date().toISOString()),
  ]
    .filter(Boolean)
    .join('\n')
}

export function SystemHealthPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [h, i] = await Promise.all([
      fetch('/api/health', { cache: 'no-store' })
        .then((r) => r.json())
        .then((b) => b.data ?? null)
        .catch(() => null),
      fetch('/api/admin/system', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((b) => b?.data ?? null)
        .catch(() => null),
    ])
    setHealth(h)
    setInfo(i)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  const copyDebugInfo = async () => {
    await writeToClipboard(buildDebugInfo(health, info)).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const c = health?.checks
  const disk = info?.storage.disk
  const lowDisk = disk ? disk.freeBytes / disk.totalBytes < 0.1 : false

  return (
    <section className="glass-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">System health</h2>
            {health && (
              <StatusBadge tone={OVERALL[health.status].tone}>
                {OVERALL[health.status].label}
              </StatusBadge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {health
              ? `v${health.version} · up ${formatUptime(health.uptimeSeconds)} · ${health.cloud ? 'Cloud' : 'Self-hosted'}`
              : 'Checking…'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={copyDebugInfo}
            disabled={!health && !info}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ClipboardCopy className="h-3.5 w-3.5" />
            )}
            {copied ? 'Copied' : 'Copy debug info'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={load}
            disabled={loading}
            aria-label="Refresh"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {health?.warnings?.map((warning) => (
          <div
            key={warning}
            className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </div>
        ))}

        {c && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              Services
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Tile
                icon={Database}
                label="Database"
                badge={STATUS[c.database.status]}
              >
                {typeof c.database.latencyMs === 'number' && (
                  <p>{c.database.latencyMs}ms</p>
                )}
                {info?.database.version && (
                  <p>PostgreSQL {info.database.version}</p>
                )}
              </Tile>
              <Tile icon={Zap} label="Redis" badge={STATUS[c.redis.status]}>
                {typeof c.redis.latencyMs === 'number' && (
                  <p>{c.redis.latencyMs}ms</p>
                )}
              </Tile>
              <Tile
                icon={HardDrive}
                label="Storage"
                badge={
                  lowDisk && c.storage.status === 'up'
                    ? { tone: 'warning', label: 'Low space' }
                    : STATUS[c.storage.status]
                }
              >
                <p>
                  {capitalize(c.storage.provider ?? 'local')}
                  {typeof c.storage.latencyMs === 'number' &&
                    ` · ${c.storage.latencyMs}ms`}
                </p>
                {disk && (
                  <p>
                    {formatBytes(disk.freeBytes)} free of{' '}
                    {formatBytes(disk.totalBytes)}
                  </p>
                )}
              </Tile>
              <Tile
                icon={ListTodo}
                label="Event queue"
                badge={STATUS[c.eventQueue.status]}
              >
                <p>
                  {c.eventQueue.workers ?? 0}{' '}
                  {c.eventQueue.workers === 1 ? 'worker' : 'workers'} ·{' '}
                  {c.eventQueue.waiting ?? 0} waiting
                </p>
                {(c.eventQueue.failed ?? 0) > 0 && (
                  <p className="text-amber-500">{c.eventQueue.failed} failed</p>
                )}
              </Tile>
              <Tile
                icon={ShieldCheck}
                label="Virus scanning"
                badge={STATUS[c.virusScanning.status]}
              />
              {c.stripe && (
                <Tile
                  icon={CreditCard}
                  label="Stripe"
                  badge={STATUS[c.stripe.status]}
                />
              )}
            </div>
          </div>
        )}

        {info && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Setup</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Tile
                icon={Mail}
                label="Email"
                badge={
                  info.email.configured
                    ? STATUS.configured
                    : { tone: 'warning', label: 'Not set up' }
                }
              >
                <p>{info.email.provider === 'smtp' ? 'SMTP' : 'Resend'}</p>
              </Tile>
              <Tile
                icon={Webhook}
                label="Discord alerts"
                badge={
                  info.discordAlerts.configured
                    ? STATUS.configured
                    : STATUS.not_configured
                }
              />
              <Tile
                icon={KeyRound}
                label="License"
                badge={licenseBadge(info.license.state)}
              >
                {info.license.features?.length ? (
                  <p>{info.license.features.join(', ')}</p>
                ) : null}
              </Tile>
              <Tile icon={Cpu} label="Server">
                <p>
                  {info.runtime.bun
                    ? `Bun ${info.runtime.bun}`
                    : `Node ${info.runtime.node}`}{' '}
                  · {info.runtime.memoryMb} MB
                </p>
                <p className="truncate" title={info.runtime.platform}>
                  {info.runtime.platform}
                </p>
              </Tile>
            </div>
          </div>
        )}

        {info?.database.latestMigration && (
          <p className="text-xs text-muted-foreground">
            Latest database migration:{' '}
            <code>{info.database.latestMigration}</code>
          </p>
        )}
      </div>
    </section>
  )
}
