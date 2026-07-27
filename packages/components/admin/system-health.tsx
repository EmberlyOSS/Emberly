'use client'

import { useEffect, useState } from 'react'

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Database,
  HardDrive,
  ListTodo,
  Loader2,
  RefreshCw,
  Server,
  ShieldCheck,
  XCircle,
  Zap,
} from 'lucide-react'

import { Button } from '@/packages/components/ui/button'

type CheckStatus = 'up' | 'down' | 'disabled' | 'configured' | 'not_configured'

interface HealthCheck {
  status: CheckStatus
  latencyMs?: number
  provider?: string | null
  waiting?: number
  active?: number
  failed?: number
  delayed?: number
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

const STATUS_STYLES: Record<CheckStatus, string> = {
  up: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  configured: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  down: 'text-destructive bg-destructive/10 border-destructive/20',
  not_configured: 'text-muted-foreground bg-muted/30 border-border/30',
  disabled: 'text-muted-foreground bg-muted/30 border-border/30',
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'up' || status === 'configured') {
    return <CheckCircle2 className="h-4 w-4" />
  }
  if (status === 'down') {
    return <XCircle className="h-4 w-4" />
  }
  return <Circle className="h-4 w-4" />
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const CHECK_META: Array<{
  key: keyof HealthResponse['checks']
  label: string
  icon: typeof Database
}> = [
  { key: 'database', label: 'Database', icon: Database },
  { key: 'redis', label: 'Redis', icon: Zap },
  { key: 'storage', label: 'Storage', icon: HardDrive },
  { key: 'virusScanning', label: 'Virus Scanning', icon: ShieldCheck },
  { key: 'eventQueue', label: 'Event Queue', icon: ListTodo },
  { key: 'stripe', label: 'Stripe', icon: Server },
]

export function SystemHealthPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      const json = await res.json()
      setHealth(json.data ?? null)
    } catch {
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="glass-card">
      <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              health
                ? STATUS_STYLES[
                    health.status === 'ok'
                      ? 'up'
                      : health.status === 'down'
                        ? 'down'
                        : 'not_configured'
                  ]
                : 'text-muted-foreground bg-muted/30 border-border/30'
            }`}
          >
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">System Health</h2>
            <p className="text-sm text-muted-foreground">
              {health
                ? `v${health.version} · uptime ${formatUptime(health.uptimeSeconds)} · ${health.cloud ? 'cloud' : 'self-hosted'}`
                : 'Loading status…'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealth}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {health && health.warnings && health.warnings.length > 0 && (
        <div className="px-6 pb-4 space-y-2">
          {health.warnings.map((warning) => (
            <div
              key={warning}
              className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400"
            >
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 pb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CHECK_META.filter((meta) => health?.checks[meta.key]).map((meta) => {
          const check = health!.checks[meta.key]!
          const Icon = meta.icon
          return (
            <div
              key={meta.key}
              className="rounded-xl border border-border/40 bg-muted/20 p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {meta.label}
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[check.status]}`}
                >
                  <StatusIcon status={check.status} />
                  {check.status.replace('_', ' ')}
                </span>
              </div>
              {typeof check.latencyMs === 'number' && (
                <p className="text-xs text-muted-foreground">
                  {check.latencyMs}ms
                </p>
              )}
              {check.provider && (
                <p className="text-xs text-muted-foreground capitalize">
                  {check.provider}
                </p>
              )}
              {meta.key === 'eventQueue' && check.status === 'up' && (
                <p className="text-xs text-muted-foreground">
                  {check.waiting ?? 0} waiting · {check.active ?? 0} active ·{' '}
                  {check.failed ?? 0} failed
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
