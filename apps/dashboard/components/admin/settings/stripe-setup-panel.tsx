'use client'

import { useCallback, useEffect, useState } from 'react'

import { AlertTriangle, CheckCircle2, Loader2, Wand2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { StripeSetupStatus } from '@/lib/stripe/setup'

const WEBHOOK_TEXT: Record<StripeSetupStatus['webhook']['state'], string> = {
  ok: 'Webhook connected',
  missing: 'Webhook not set up',
  outdated: 'Webhook is missing some events',
  local:
    'Webhooks need a public address. Use `stripe listen` while developing locally.',
}

function Line({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      )}
      <span>{children}</span>
    </p>
  )
}

export function StripeSetupPanel({ secretKey }: { secretKey?: string }) {
  const [status, setStatus] = useState<StripeSetupStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/admin/stripe/setup')
      .then((r) => r.json())
      .then((r) => setStatus(r.data ?? null))
      .catch(() => setStatus(null))
  }, [])

  useEffect(load, [load])

  const setup = async () => {
    setBusy(true)
    setError(null)
    const res = await fetch('/api/admin/stripe/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secretKey ? { secretKey } : {}),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(json.error ?? 'Setup failed')
      return
    }
    setStatus(json.data)
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-secondary/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Automatic setup</p>
          <p className="text-sm text-muted-foreground">
            Checks your key, creates the webhook and its secret, and syncs every
            product and price.
          </p>
        </div>
        <Button size="sm" disabled={busy} onClick={setup}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {status?.connected ? 'Run setup again' : 'Connect Stripe'}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status && (
        <div className="space-y-1.5">
          <Line ok={status.connected}>
            {status.connected && status.account
              ? `Connected to ${status.account.name ?? status.account.id} (${status.account.livemode ? 'live' : 'test'} mode)`
              : (status.error ?? 'No Stripe key yet')}
          </Line>
          {status.connected && (
            <Line ok={status.webhook.state === 'ok'}>
              {WEBHOOK_TEXT[status.webhook.state]}
              {status.webhook.state !== 'local' && (
                <span className="block font-mono text-xs text-muted-foreground">
                  {status.webhook.url}
                </span>
              )}
            </Line>
          )}
          <Line
            ok={
              status.products.unsynced.length === 0 &&
              status.products.unpriced.length === 0
            }
          >
            {status.products.total} products
            {status.products.unsynced.length > 0 &&
              `, not in Stripe yet: ${status.products.unsynced.join(', ')}`}
            {status.products.unpriced.length > 0 &&
              `, need a price in Admin → Products: ${status.products.unpriced.join(', ')}`}
          </Line>
        </div>
      )}
    </div>
  )
}
