'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Label } from '@/packages/components/ui/label'
import { Switch } from '@/packages/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { useToast } from '@/packages/hooks/use-toast'
import { User } from '@/packages/types/components/user'

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
        description: error instanceof Error ? error.message : 'Failed to update settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Public profile */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="profile-visibility">Public Profile</Label>
          <p className="text-sm text-muted-foreground">
            Make your profile visible to others at{' '}
            <span className="font-medium">/user/{(user as any).name}</span>
          </p>
        </div>
        <Switch
          id="profile-visibility"
          checked={(user as any).isProfilePublic ?? true}
          onCheckedChange={(c) => handleValueChange(c, 'isProfilePublic', 'Profile visibility updated')}
          disabled={isLoading}
        />
      </div>

      {/* Show linked accounts on profile */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="show-linked-accounts">Show Linked Accounts</Label>
          <p className="text-sm text-muted-foreground">
            Display your linked GitHub and Discord accounts on your public profile
          </p>
        </div>
        <Switch
          id="show-linked-accounts"
          checked={(user as any).showLinkedAccounts ?? false}
          onCheckedChange={(c) => handleValueChange(c, 'showLinkedAccounts', 'Linked accounts visibility updated')}
          disabled={isLoading}
        />
      </div>

      {/* Randomize file URLs */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="randomize-urls">Randomize File URLs</Label>
          <p className="text-sm text-muted-foreground">
            New uploads will use randomized URLs instead of the original filename
          </p>
        </div>
        <Switch
          id="randomize-urls"
          checked={user.randomizeFileUrls}
          onCheckedChange={(c) => handleValueChange(c, 'randomizeFileUrls', 'File URL settings updated')}
          disabled={isLoading}
        />
      </div>

      {/* Rich embeds */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="rich-embeds">Enable Rich Embeds</Label>
          <p className="text-sm text-muted-foreground">
            Shared files will include rich metadata previews on Discord, X, and other platforms
          </p>
        </div>
        <Switch
          id="rich-embeds"
          checked={user.enableRichEmbeds}
          onCheckedChange={(v) => handleValueChange(v, 'enableRichEmbeds', 'Rich embed settings updated')}
          disabled={isLoading}
        />
      </div>

      {/* Default file expiry action */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>Default file expiry action</Label>
          <p className="text-sm text-muted-foreground">What happens to a file when it expires</p>
        </div>
        <div className="w-40">
          <Select
            value={user.defaultFileExpirationAction ?? undefined}
            onValueChange={(v) => handleValueChange(v, 'defaultFileExpirationAction', 'Default expiry action updated')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DELETE">Delete file</SelectItem>
              <SelectItem value="SET_PRIVATE">Set to private</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Default file expiry time */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>Default file expiry time</Label>
          <p className="text-sm text-muted-foreground">Default duration before a new upload expires</p>
        </div>
        <div className="w-40">
          <Select
            value={user.defaultFileExpiration ?? undefined}
            onValueChange={(v) => handleValueChange(v, 'defaultFileExpiration', 'Default expiry time updated')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DISABLED">Disabled</SelectItem>
              <SelectItem value="HOUR">One hour</SelectItem>
              <SelectItem value="DAY">One day</SelectItem>
              <SelectItem value="WEEK">One week</SelectItem>
              <SelectItem value="MONTH">One month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
