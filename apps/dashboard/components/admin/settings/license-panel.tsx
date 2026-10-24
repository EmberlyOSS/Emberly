'use client'

import { useEffect, useRef, useState } from 'react'

import { ImageUp, Loader2, Trash2 } from 'lucide-react'

import { useBranding } from '@/components/providers/branding-provider'
import { useFeatures } from '@/components/providers/features-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

type LicenseInfo =
  | { state: 'none' }
  | { state: 'invalid'; reason: string }
  | {
      state: 'valid' | 'expired' | 'wrong-domain'
      licensee: string
      features: string[]
      domains?: string[]
      expiresAt?: string
      checkIn?: {
        checkedAt: string | null
        failedAt: string | null
        error: string | null
        status: string | null
        activations: number | null
        maxActivations: number | null
        overLimit: boolean
      } | null
    }

const STATE_LABEL: Record<LicenseInfo['state'], string> = {
  none: 'No license',
  invalid: 'Invalid key',
  valid: 'Active',
  expired: 'Expired',
  'wrong-domain': 'Wrong domain',
}

const FEATURE_LABEL: Record<string, string> = {
  'white-label': 'White-label branding',
  cloud: 'Hosted service',
}

export function LicensePanel() {
  const { whiteLabel } = useFeatures()
  const branding = useBranding()
  const { toast } = useToast()
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [logo, setLogo] = useState(branding.logo)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/license')
      .then((r) => r.json())
      .then((r) => setLicense(r.data ?? { state: 'none' }))
      .catch(() => setLicense({ state: 'none' }))
  }, [])

  const upload = async (file: File) => {
    setBusy(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/settings/logo', { method: 'POST', body })
      if (!res.ok) throw new Error(await res.text())
      setLogo((await res.json()).data.url)
      toast({
        title: 'Logo updated',
        description: 'Reload to see it everywhere.',
      })
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    await fetch('/api/settings/logo', { method: 'DELETE' })
    setLogo(null)
    setBusy(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/70 bg-secondary/20 p-4">
        {license === null ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {'licensee' in license ? license.licensee : 'Emberly'}
              </span>
              <Badge
                variant={license.state === 'valid' ? 'default' : 'secondary'}
              >
                {STATE_LABEL[license.state]}
              </Badge>
            </div>
            {'features' in license && (
              <p className="text-muted-foreground">
                {license.features.map((f) => FEATURE_LABEL[f] ?? f).join(', ')}
                {license.expiresAt &&
                  ` · ${license.state === 'expired' ? 'expired' : 'renews'} ${new Date(license.expiresAt).toLocaleDateString()}`}
                {license.state === 'wrong-domain' &&
                  ` · valid for ${license.domains?.join(', ')}`}
              </p>
            )}
            {'checkIn' in license && license.checkIn && (
              <p
                className={
                  license.checkIn.overLimit ||
                  license.checkIn.status === 'revoked'
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                }
              >
                {license.checkIn.checkedAt
                  ? `Last checked ${new Date(license.checkIn.checkedAt).toLocaleString()}`
                  : 'Not checked in yet'}
                {license.checkIn.activations != null &&
                  ` · ${license.checkIn.activations} of ${license.checkIn.maxActivations} servers`}
                {license.checkIn.overLimit &&
                  ' · more servers than this license allows'}
                {license.checkIn.status === 'revoked' &&
                  ' · revoked by Emberly'}
                {license.checkIn.error &&
                  license.checkIn.failedAt &&
                  ` · last attempt failed (${license.checkIn.error}), still using the current key`}
              </p>
            )}
            {license.state === 'invalid' && (
              <p className="text-muted-foreground">{license.reason}</p>
            )}
            {license.state === 'none' && (
              <p className="text-muted-foreground">
                Set <code>EMBERLY_LICENSE_KEY</code> on the server to unlock
                white-label branding.
              </p>
            )}
          </div>
        )}
        {license?.state !== 'valid' && (
          <Button asChild variant="outline" size="sm">
            <a href="mailto:hey@embrly.ca?subject=Emberly%20license">
              Get a license
            </a>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-background">
            {logo ? (
              <img src={logo} alt="" className="h-9 w-9 object-contain" />
            ) : (
              <ImageUp className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="text-sm">
            <p className="font-medium">Logo</p>
            <p className="text-muted-foreground">
              {whiteLabel
                ? 'PNG, JPEG or WebP, up to 1 MB. Square images work best.'
                : 'A white-label license lets you replace the Emberly logo.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload(file)
              e.target.value = ''
            }}
          />
          {logo && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy || !whiteLabel}
              onClick={remove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !whiteLabel}
            onClick={() => input.current?.click()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  )
}
