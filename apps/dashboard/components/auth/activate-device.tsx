'use client'

import { useEffect, useState } from 'react'

import { CheckCircle2, Laptop, ShieldAlert, XCircle } from 'lucide-react'

import { Icons } from '@/components/shared/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type DeviceRequest = { app: string; deviceName: string }
type Step = 'enter' | 'review' | 'approved' | 'denied'

async function post(body: object) {
  const res = await fetch('/api/device/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Something went wrong')
  return json.data
}

export function ActivateDevice({
  initialCode,
  accountName,
}: {
  initialCode: string
  accountName: string
}) {
  const [code, setCode] = useState(initialCode)
  const [request, setRequest] = useState<DeviceRequest | null>(null)
  const [step, setStep] = useState<Step>('enter')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const lookup = async (value = code) => {
    setBusy(true)
    setError(null)
    try {
      setRequest(await post({ userCode: value }))
      setStep('review')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const decide = async (approve: boolean) => {
    setBusy(true)
    setError(null)
    try {
      await post({ userCode: code, approve })
      setStep(approve ? 'approved' : 'denied')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (initialCode) lookup(initialCode)
  }, [])

  if (step === 'approved' || step === 'denied') {
    const approved = step === 'approved'
    const Icon = approved ? CheckCircle2 : XCircle
    return (
      <div className="space-y-3 text-center">
        <Icon
          className={`mx-auto h-10 w-10 ${approved ? 'text-emerald-500' : 'text-muted-foreground'}`}
        />
        <h1 className="text-xl font-semibold tracking-tight">
          {approved ? `${request?.app} is connected` : 'Request denied'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {approved
            ? 'You can close this tab and go back to the app. Revoke its access any time in Profile → API.'
            : 'Nothing was connected. You can close this tab.'}
        </p>
      </div>
    )
  }

  if (step === 'review' && request) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Laptop className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Connect {request.app}?
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{request.app}</span>{' '}
            on{' '}
            <span className="font-medium text-foreground">
              {request.deviceName}
            </span>{' '}
            wants to upload and manage files as{' '}
            <span className="font-medium text-foreground">{accountName}</span>.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-secondary/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Check this matches the code in the app
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.2em]">
            {code.toUpperCase()}
          </p>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          Only approve if you started this from the app yourself. Never approve
          a code someone else sent you.
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => decide(false)}
          >
            Deny
          </Button>
          <Button disabled={busy} onClick={() => decide(true)}>
            {busy && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Approve
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        lookup()
      }}
    >
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Sign in to an app
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the code shown in the app.
        </p>
      </div>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="XXXX-XXXX"
        autoFocus
        autoComplete="off"
        maxLength={9}
        className="h-14 text-center font-mono text-2xl uppercase tracking-[0.2em]"
      />
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={busy || code.replace(/[^a-z0-9]/gi, '').length < 8}
      >
        {busy && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        Continue
      </Button>
    </form>
  )
}
