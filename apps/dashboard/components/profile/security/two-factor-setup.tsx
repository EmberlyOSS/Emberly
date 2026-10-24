'use client'

import { useEffect, useRef, useState } from 'react'

import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { cn } from '@/lib/utils'
import { writeToClipboard } from '@/lib/utils/clipboard'

import { useToast } from '@/hooks/use-toast'

const CODE_LENGTH = 6

async function apiError(res: Response, fallback: string) {
  const data = await res.json().catch(() => null)
  return new Error(typeof data?.error === 'string' ? data.error : fallback)
}

/** Six boxes over one real input, so paste and one-time-code autofill work. */
function CodeInput({
  id,
  value,
  onChange,
  onComplete,
  autoFocus,
  disabled,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  autoFocus?: boolean
  disabled?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="relative mx-auto w-fit">
      <div className="flex gap-2" aria-hidden>
        {Array.from({ length: CODE_LENGTH }, (_, i) => {
          const active =
            focused &&
            (i === value.length ||
              (i === CODE_LENGTH - 1 && value.length === CODE_LENGTH))
          return (
            <div
              key={i}
              className={cn(
                'flex h-12 w-10 items-center justify-center rounded-lg border bg-background/60 font-mono text-xl font-semibold transition-colors sm:h-14 sm:w-12',
                active
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border',
                i === 2 && 'mr-2'
              )}
            >
              {value[i] ?? ''}
            </div>
          )
        })}
      </div>
      <input
        id={id}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH)
          onChange(next)
          if (next.length === CODE_LENGTH) onComplete?.(next)
        }}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  )
}

function Steps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {labels.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                done && 'bg-primary text-primary-foreground',
                active && 'bg-primary/15 text-primary ring-1 ring-primary/40',
                !done && !active && 'bg-muted text-muted-foreground'
              )}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden truncate text-xs sm:inline',
                active ? 'font-medium text-foreground' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <span
                className={cn(
                  'h-px flex-1',
                  done ? 'bg-primary/60' : 'bg-border'
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Panel({
  icon: Icon,
  tone = 'primary',
  title,
  description,
  steps,
  step,
  children,
  footer,
}: {
  icon: typeof ShieldCheck
  tone?: 'primary' | 'danger'
  title: string
  description: string
  steps: string[]
  step: number
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        'overflow-hidden rounded-xl border bg-muted/10 animate-in fade-in-0 slide-in-from-top-1 duration-200',
        tone === 'danger' ? 'border-destructive/30' : 'border-primary/25'
      )}
    >
      <div className="space-y-4 border-b border-border/50 px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
              tone === 'danger'
                ? 'bg-destructive/10 text-destructive ring-destructive/20'
                : 'bg-primary/10 text-primary ring-primary/20'
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Steps labels={steps} current={step} />
      </div>
      <div className="px-5 py-6">{children}</div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/50 bg-muted/20 px-5 py-3">
        {footer}
      </div>
    </section>
  )
}

export function EnableTwoFactorSetup({
  onCancel,
  onEnabled,
}: {
  onCancel: () => void
  onEnabled: () => void
}) {
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [otpauth, setOtpauth] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [appCode, setAppCode] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [copied, setCopied] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      try {
        const res = await fetch('/api/profile/2fa', {
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw await apiError(res, "Couldn't start setup")
        const payload = await res.json()
        const data = payload?.data ?? payload
        setSecret(data?.secret ?? null)
        setOtpauth(data?.otpauth ?? null)
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Couldn't start setup"
        )
      }
    })()
  }, [])

  const fail = (error: unknown, fallback: string) =>
    toast({
      title: fallback,
      description: error instanceof Error ? error.message : undefined,
      variant: 'destructive',
    })

  async function checkAppCode(code = appCode) {
    if (!secret || code.length < CODE_LENGTH || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/profile/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, token: code, stage: 'send-code' }),
      })
      if (!res.ok) throw await apiError(res, 'That code didn’t work')
      setStep(2)
    } catch (error) {
      setAppCode('')
      fail(error, 'That code didn’t work')
    } finally {
      setBusy(false)
    }
  }

  async function finish(code = emailCode) {
    if (!secret || code.length < CODE_LENGTH || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/profile/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          verificationCode: code,
          stage: 'verify-code',
        }),
      })
      if (!res.ok) throw await apiError(res, 'That code didn’t work')
      toast({
        title: 'Two-factor authentication is on',
        description: 'You’ll be asked for a code when you sign in.',
      })
      onEnabled()
    } catch (error) {
      setEmailCode('')
      fail(error, 'That code didn’t work')
    } finally {
      setBusy(false)
    }
  }

  async function copySecret() {
    if (!secret) return
    await writeToClipboard(secret).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const groupedSecret = secret?.match(/.{1,4}/g)?.join(' ') ?? ''

  return (
    <Panel
      icon={ShieldCheck}
      title="Turn on two-factor authentication"
      description="Protect your account with a code from an authenticator app."
      steps={['Scan', 'Check code', 'Confirm email']}
      step={step}
      footer={
        <>
          {step > 0 && (
            <Button
              variant="ghost"
              className="mr-auto"
              disabled={busy}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          )}
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          {step === 0 && (
            <Button disabled={!secret} onClick={() => setStep(1)}>
              I’ve added it
            </Button>
          )}
          {step === 1 && (
            <Button
              disabled={busy || appCode.length < CODE_LENGTH}
              onClick={() => checkAppCode()}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          )}
          {step === 2 && (
            <Button
              disabled={busy || emailCode.length < CODE_LENGTH}
              onClick={() => finish()}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Turn on
            </Button>
          )}
        </>
      }
    >
      {step === 0 && (
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="mx-auto flex h-[184px] w-[184px] shrink-0 items-center justify-center rounded-2xl bg-white p-3 shadow-sm">
            {otpauth ? (
              <QRCodeSVG value={otpauth} size={160} level="M" />
            ) : loadError ? (
              <p className="px-2 text-center text-sm text-red-600">
                {loadError}
              </p>
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            )}
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Open an authenticator app such as 1Password, Google
                Authenticator or Authy, and scan this code.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Can’t scan it? Enter this key instead:
              </p>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 py-1.5 pl-3 pr-1.5">
                <code className="min-w-0 flex-1 break-all font-mono text-sm tracking-wide">
                  {groupedSecret || '…'}
                </code>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  disabled={!secret}
                  onClick={copySecret}
                  aria-label="Copy key"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5 text-center">
          <div className="space-y-1">
            <Label htmlFor="tfa-app-code" className="text-base">
              Enter the code from your app
            </Label>
            <p className="text-sm text-muted-foreground">
              It changes every 30 seconds.
            </p>
          </div>
          <CodeInput
            id="tfa-app-code"
            value={appCode}
            onChange={setAppCode}
            onComplete={checkAppCode}
            disabled={busy}
            autoFocus
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tfa-email-code" className="text-base">
              Check your email
            </Label>
            <p className="text-sm text-muted-foreground">
              We sent a code to your email address to confirm it’s you.
            </p>
          </div>
          <CodeInput
            id="tfa-email-code"
            value={emailCode}
            onChange={setEmailCode}
            onComplete={finish}
            disabled={busy}
            autoFocus
          />
        </div>
      )}
    </Panel>
  )
}

export function DisableTwoFactorSetup({
  onCancel,
  onDisabled,
}: {
  onCancel: () => void
  onDisabled: () => void
}) {
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [password, setPassword] = useState('')
  const [appCode, setAppCode] = useState('')
  const [emailCode, setEmailCode] = useState('')

  async function sendCode() {
    if (!password || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/profile/2fa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, stage: 'send-code' }),
      })
      if (!res.ok) throw await apiError(res, 'Couldn’t continue')
      setStep(1)
    } catch (error) {
      toast({
        title: 'Couldn’t continue',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  async function turnOff() {
    if (appCode.length < CODE_LENGTH || emailCode.length < CODE_LENGTH || busy)
      return
    setBusy(true)
    try {
      const res = await fetch('/api/profile/2fa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totpToken: appCode,
          verificationCode: emailCode,
          stage: 'verify-code',
        }),
      })
      if (!res.ok) throw await apiError(res, 'Couldn’t turn it off')
      toast({ title: 'Two-factor authentication is off' })
      onDisabled()
    } catch (error) {
      toast({
        title: 'Couldn’t turn it off',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel
      icon={ShieldOff}
      tone="danger"
      title="Turn off two-factor authentication"
      description="Your account will only be protected by your password."
      steps={['Password', 'Confirm codes']}
      step={step}
      footer={
        <>
          {step > 0 && (
            <Button
              variant="ghost"
              className="mr-auto"
              disabled={busy}
              onClick={() => setStep(0)}
            >
              Back
            </Button>
          )}
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          {step === 0 ? (
            <Button disabled={busy || !password} onClick={sendCode}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          ) : (
            <Button
              variant="destructive"
              disabled={
                busy ||
                appCode.length < CODE_LENGTH ||
                emailCode.length < CODE_LENGTH
              }
              onClick={turnOff}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Turn off
            </Button>
          )}
        </>
      }
    >
      {step === 0 ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            sendCode()
          }}
        >
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Lost your authenticator? Sign in with a recovery code instead and
            set 2FA up again on your new device.
          </div>
          <div className="space-y-2">
            <Label htmlFor="tfa-password">Your password</Label>
            <Input
              id="tfa-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </form>
      ) : (
        <div className="space-y-6 text-center">
          <div className="space-y-3">
            <Label
              htmlFor="tfa-off-app"
              className="flex items-center justify-center gap-2"
            >
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              Code from your authenticator app
            </Label>
            <CodeInput
              id="tfa-off-app"
              value={appCode}
              onChange={setAppCode}
              disabled={busy}
              autoFocus
            />
          </div>
          <div className="space-y-3">
            <Label
              htmlFor="tfa-off-email"
              className="flex items-center justify-center gap-2"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              Code we just emailed you
            </Label>
            <CodeInput
              id="tfa-off-email"
              value={emailCode}
              onChange={setEmailCode}
              disabled={busy}
            />
          </div>
        </div>
      )}
    </Panel>
  )
}
