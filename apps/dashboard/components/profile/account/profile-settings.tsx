'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { User } from '@/types/components/user'

interface ProfileSettingsProps {
  user: User
  onUpdate: () => void
}

export function ProfileSettings({ user, onUpdate }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleValueChange = async (
    value: boolean | string,
    key: string,
    description: string
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update settings')
      }

      router.refresh()
      onUpdate()
      toast({ title: 'Settings updated', description })
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Public profile
        </h3>
        <div className="divide-y divide-border/60 rounded-xl border border-border/60">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="space-y-0.5">
              <Label htmlFor="profile-visibility">Public profile</Label>
              <p className="text-sm text-muted-foreground">
                Anyone can see your profile at{' '}
                <span className="font-medium">/user/{(user as any).name}</span>
              </p>
            </div>
            <Switch
              id="profile-visibility"
              checked={(user as any).isProfilePublic ?? true}
              onCheckedChange={(c) =>
                handleValueChange(
                  c,
                  'isProfilePublic',
                  'Profile visibility updated'
                )
              }
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="space-y-0.5">
              <Label htmlFor="show-linked-accounts">Show linked accounts</Label>
              <p className="text-sm text-muted-foreground">
                Show your GitHub and Discord on your public profile.
              </p>
            </div>
            <Switch
              id="show-linked-accounts"
              checked={(user as any).showLinkedAccounts ?? false}
              onCheckedChange={(c) =>
                handleValueChange(
                  c,
                  'showLinkedAccounts',
                  'Linked accounts visibility updated'
                )
              }
              disabled={isLoading}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Uploads</h3>
        <div className="divide-y divide-border/60 rounded-xl border border-border/60">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="space-y-0.5">
              <Label htmlFor="randomize-urls">Random file names</Label>
              <p className="text-sm text-muted-foreground">
                New uploads get a random link instead of using their file name.
              </p>
            </div>
            <Switch
              id="randomize-urls"
              checked={user.randomizeFileUrls}
              onCheckedChange={(c) =>
                handleValueChange(
                  c,
                  'randomizeFileUrls',
                  'File URL settings updated'
                )
              }
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="space-y-0.5">
              <Label htmlFor="rich-embeds">Rich link previews</Label>
              <p className="text-sm text-muted-foreground">
                Links you share show a preview card on Discord, X and other
                sites.
              </p>
            </div>
            <Switch
              id="rich-embeds"
              checked={user.enableRichEmbeds}
              onCheckedChange={(v) =>
                handleValueChange(
                  v,
                  'enableRichEmbeds',
                  'Rich embed settings updated'
                )
              }
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="space-y-0.5">
              <Label>When a file expires</Label>
              <p className="text-sm text-muted-foreground">
                Delete it, or keep it but make it private.
              </p>
            </div>
            <div className="w-40">
              <Select
                value={user.defaultFileExpirationAction ?? undefined}
                onValueChange={(v) =>
                  handleValueChange(
                    v,
                    'defaultFileExpirationAction',
                    'Default expiry action updated'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DELETE">Delete file</SelectItem>
                  <SelectItem value="SET_PRIVATE">Make it private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="space-y-0.5">
              <Label>Expire new uploads after</Label>
              <p className="text-sm text-muted-foreground">
                You can still change it per file.
              </p>
            </div>
            <div className="w-40">
              <Select
                value={user.defaultFileExpiration ?? undefined}
                onValueChange={(v) =>
                  handleValueChange(
                    v,
                    'defaultFileExpiration',
                    'Default expiry time updated'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISABLED">Never</SelectItem>
                  <SelectItem value="HOUR">One hour</SelectItem>
                  <SelectItem value="DAY">One day</SelectItem>
                  <SelectItem value="WEEK">One week</SelectItem>
                  <SelectItem value="MONTH">One month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
