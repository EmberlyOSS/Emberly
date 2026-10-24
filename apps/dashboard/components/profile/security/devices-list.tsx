'use client'

import { useEffect, useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  Check,
  Loader2,
  LogOut,
  Monitor,
  Pencil,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { parseUserAgent } from '@/lib/utils/user-agent'

interface Device {
  id: string
  name: string
  userAgent: string | null
  lastLocation: string | null
  lastIp: string | null
  firstSeenAt: string
  lastSeenAt: string
  current: boolean
}

function DeviceIcon({ userAgent }: { userAgent: string | null }) {
  const { device } = parseUserAgent(userAgent)
  const Icon =
    device === 'Mobile' ? Smartphone : device === 'Tablet' ? Tablet : Monitor
  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
}

export function DevicesList() {
  const { toast } = useToast()
  const [devices, setDevices] = useState<Device[] | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const [signingOutAll, setSigningOutAll] = useState(false)

  const signOutEverywhere = async () => {
    setSigningOutAll(true)
    const res = await fetch('/api/profile/sessions', { method: 'DELETE' })
    if (!res.ok) {
      setSigningOutAll(false)
      toast({ title: "Couldn't sign out everywhere", variant: 'destructive' })
      return
    }
    window.location.href = '/auth/login?revoked=true'
  }

  const load = async () => {
    try {
      const res = await fetch('/api/profile/devices')
      const body = await res.json()
      setDevices(body.data?.devices ?? [])
    } catch {
      setDevices([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rename = async (id: string) => {
    setBusy(id)
    const res = await fetch(`/api/profile/devices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setBusy(null)
    if (!res.ok) {
      toast({ title: 'Could not rename device', variant: 'destructive' })
      return
    }
    setEditing(null)
    load()
  }

  const signOut = async (device: Device) => {
    setBusy(device.id)
    const res = await fetch(`/api/profile/devices/${device.id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      setBusy(null)
      toast({ title: 'Could not sign out device', variant: 'destructive' })
      return
    }
    if (device.current) {
      window.location.href = '/auth/login'
      return
    }
    setBusy(null)
    toast({
      title: 'Device signed out',
      description: `${device.name} will need to sign in again.`,
    })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Your devices</h3>
          <p className="text-sm text-muted-foreground">
            Browsers and computers signed in to your account. We email you when
            a new one signs in.
          </p>
        </div>
        {confirmAll ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Sign out every device, including this one?
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={signingOutAll}
              onClick={() => setConfirmAll(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={signingOutAll}
              onClick={signOutEverywhere}
            >
              {signingOutAll && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Sign out all
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmAll(true)}
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            Sign out everywhere
          </Button>
        )}
      </div>

      {devices === null ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : devices.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No devices yet. They appear here after you next sign in.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
          {devices.map((device) => (
            <li
              key={device.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <DeviceIcon userAgent={device.userAgent} />

              <div className="min-w-0 flex-1">
                {editing === device.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') rename(device.id)
                        if (e.key === 'Escape') setEditing(null)
                      }}
                      maxLength={64}
                      autoFocus
                      className="h-8"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={!name.trim() || busy === device.id}
                      onClick={() => rename(device.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditing(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {device.name}
                    </span>
                    {device.current && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                        This device
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Rename device"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditing(device.id)
                        setName(device.name)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[
                    device.lastLocation,
                    device.current
                      ? 'Active now'
                      : `Last active ${formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              {!device.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy === device.id}
                  onClick={() => signOut(device)}
                >
                  {busy === device.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="mr-1.5 h-4 w-4" />
                      Sign out
                    </>
                  )}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
