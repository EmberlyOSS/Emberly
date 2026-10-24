'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  Bell,
  CreditCard,
  Mail,
  Megaphone,
  Shield,
  Sparkles,
  User,
  Webhook,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { useToast } from '@/hooks/use-toast'

export interface EmailPreferences {
  security: boolean
  account: boolean
  billing: boolean
  marketing: boolean
  productUpdates: boolean
}

type Category = keyof EmailPreferences

interface EmailPreferencesProps {
  userId: string
  emailNotificationsEnabled: boolean
  emailPreferences: EmailPreferences
  discordWebhookUrl?: string | null
  discordNotificationsEnabled?: boolean
  discordPreferences?: EmailPreferences
  onUpdate: () => void
}

const CATEGORIES: Array<{
  key: Category
  label: string
  description: string
  icon: typeof Shield
}> = [
  {
    key: 'security',
    label: 'Security',
    description:
      'New sign-ins, password and two-factor changes, API keys and suspicious activity',
    icon: Shield,
  },
  {
    key: 'account',
    label: 'Account',
    description:
      'Profile and email changes, applications, shared files, data exports and deletion',
    icon: User,
  },
  {
    key: 'billing',
    label: 'Billing',
    description: 'Payments, receipts, subscription changes and refunds',
    icon: CreditCard,
  },
  {
    key: 'productUpdates',
    label: 'Product updates',
    description: 'Perks, extra storage and new features',
    icon: Sparkles,
  },
  {
    key: 'marketing',
    label: 'Announcements',
    description: 'Offers, newsletters and announcements',
    icon: Megaphone,
  },
]

const DEFAULT_DISCORD: EmailPreferences = {
  security: true,
  account: false,
  billing: true,
  marketing: false,
  productUpdates: false,
}

async function errorMessage(response: Response, fallback: string) {
  const data = await response.json().catch(() => null)
  return typeof data?.error === 'string' ? data.error : fallback
}

export function EmailPreferences({
  emailNotificationsEnabled: initialEmailEnabled,
  emailPreferences: initialEmail,
  discordWebhookUrl: initialWebhook,
  discordNotificationsEnabled: initialDiscordEnabled = false,
  discordPreferences: initialDiscord,
  onUpdate,
}: EmailPreferencesProps) {
  const [busy, setBusy] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled)
  const [email, setEmail] = useState<EmailPreferences>(initialEmail)
  const [discordEnabled, setDiscordEnabled] = useState(initialDiscordEnabled)
  const [discord, setDiscord] = useState<EmailPreferences>(
    initialDiscord ?? DEFAULT_DISCORD
  )
  const [savedWebhook, setSavedWebhook] = useState(initialWebhook ?? '')
  const [webhook, setWebhook] = useState(initialWebhook ?? '')
  const { toast } = useToast()
  const router = useRouter()

  const hasWebhook = savedWebhook.trim() !== ''
  const webhookDirty = webhook.trim() !== savedWebhook.trim()

  async function save(body: Record<string, unknown>, success?: string) {
    setBusy(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        throw new Error(
          await errorMessage(response, "Couldn't save your settings")
        )
      }
      router.refresh()
      onUpdate()
      if (success) toast({ title: success })
      return true
    } catch (error) {
      toast({
        title: "Couldn't save",
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
      return false
    } finally {
      setBusy(false)
    }
  }

  async function toggleEmail(key: Category, value: boolean) {
    if (await save({ emailPreferences: { [key]: value } })) {
      setEmail((prev) => ({ ...prev, [key]: value }))
    }
  }

  async function toggleDiscord(key: Category, value: boolean) {
    if (await save({ discordPreferences: { [key]: value } })) {
      setDiscord((prev) => ({ ...prev, [key]: value }))
    }
  }

  async function toggleEmailMaster(value: boolean) {
    if (
      await save(
        { emailNotificationsEnabled: value },
        value ? 'Email notifications on' : 'Email notifications off'
      )
    ) {
      setEmailEnabled(value)
    }
  }

  async function toggleDiscordMaster(value: boolean) {
    if (
      await save(
        { discordNotificationsEnabled: value },
        value ? 'Discord notifications on' : 'Discord notifications off'
      )
    ) {
      setDiscordEnabled(value)
    }
  }

  async function saveWebhook() {
    const url = webhook.trim()
    const body: Record<string, unknown> = { discordWebhookUrl: url || null }
    if (!url) body.discordNotificationsEnabled = false
    else if (!hasWebhook) body.discordNotificationsEnabled = true
    if (await save(body, url ? 'Webhook saved' : 'Webhook removed')) {
      setSavedWebhook(url)
      setWebhook(url)
      if (!url) setDiscordEnabled(false)
      else if (!hasWebhook) setDiscordEnabled(true)
    }
  }

  async function testWebhook() {
    setBusy(true)
    try {
      const response = await fetch('/api/profile/discord-webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhook.trim() || undefined }),
      })
      if (!response.ok) {
        throw new Error(
          await errorMessage(response, "Couldn't send the test message")
        )
      }
      toast({ title: 'Test sent', description: 'Check your Discord channel.' })
    } catch (error) {
      toast({
        title: 'Test failed',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  const discordUsable = hasWebhook && discordEnabled

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Every notification appears under the bell and on the{' '}
        <Link
          href="/dashboard/notifications"
          className="text-primary hover:underline"
        >
          Notifications
        </Link>{' '}
        page. Choose which ones are also emailed to you or posted to Discord.
      </p>

      <div className="overflow-hidden rounded-xl border">
        <div className="hidden items-center gap-4 border-b bg-muted/30 px-4 py-3 sm:grid sm:grid-cols-[1fr_4.5rem_4.5rem_4.5rem]">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Category
          </span>
          <ColumnHeader icon={Bell} label="Site" />
          <ColumnHeader icon={Mail} label="Email">
            <Switch
              checked={emailEnabled}
              onCheckedChange={toggleEmailMaster}
              disabled={busy}
              aria-label="All email notifications"
              className="scale-75"
            />
          </ColumnHeader>
          <ColumnHeader icon={Webhook} label="Discord">
            <Switch
              checked={discordUsable}
              onCheckedChange={toggleDiscordMaster}
              disabled={busy || !hasWebhook}
              aria-label="All Discord notifications"
              className="scale-75"
            />
          </ColumnHeader>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 border-b bg-muted/30 px-4 py-3 sm:hidden">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={emailEnabled}
              onCheckedChange={toggleEmailMaster}
              disabled={busy}
            />
            Email
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={discordUsable}
              onCheckedChange={toggleDiscordMaster}
              disabled={busy || !hasWebhook}
            />
            Discord
          </label>
        </div>

        <ul className="divide-y">
          {CATEGORIES.map(({ key, label, description, icon: Icon }) => (
            <li
              key={key}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_4.5rem_4.5rem_4.5rem] sm:items-center sm:gap-4"
            >
              <div className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              <Cell label="Site">
                <Switch
                  checked
                  disabled
                  aria-label={`${label} on the site (always on)`}
                />
              </Cell>
              <Cell label="Email">
                <Switch
                  checked={emailEnabled && email[key]}
                  onCheckedChange={(value) => toggleEmail(key, value)}
                  disabled={busy || !emailEnabled}
                  aria-label={`${label} by email`}
                />
              </Cell>
              <Cell label="Discord">
                <Switch
                  checked={discordUsable && discord[key]}
                  onCheckedChange={(value) => toggleDiscord(key, value)}
                  disabled={busy || !discordUsable}
                  aria-label={`${label} on Discord`}
                />
              </Cell>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        <div className="space-y-1">
          <Label htmlFor="discord-webhook-url">Discord webhook</Label>
          <p className="text-sm text-muted-foreground">
            In Discord, open a channel&apos;s settings, then Integrations →
            Webhooks → New Webhook, and paste its URL here.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="discord-webhook-url"
            type="url"
            autoComplete="off"
            placeholder="https://discord.com/api/webhooks/..."
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            disabled={busy}
            className="sm:flex-1"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-10"
              onClick={saveWebhook}
              disabled={busy || !webhookDirty}
            >
              {webhook.trim() || !hasWebhook ? 'Save' : 'Remove'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10"
              onClick={testWebhook}
              disabled={busy || !webhook.trim()}
            >
              Send test
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Password resets, sign-in links and verification codes are always
        emailed, whatever these settings say.
      </p>
    </div>
  )
}

function ColumnHeader({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Bell
  label: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {children ?? <span className="h-5" />}
    </div>
  )
}

function Cell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between sm:justify-center">
      <span className="text-sm text-muted-foreground sm:hidden">{label}</span>
      {children}
    </div>
  )
}
