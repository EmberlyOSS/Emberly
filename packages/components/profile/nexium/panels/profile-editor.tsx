'use client'

import { useState } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Badge } from '@/packages/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { useToast } from '@/packages/hooks/use-toast'
import { Loader2, Eye, EyeOff, CheckCircle, MapPin, Globe, Clock } from 'lucide-react'
import { NEXIUM_AVAILABILITY_LABELS, NEXIUM_LOOKING_FOR_LABELS } from '@/packages/lib/nexium/constants'
import type { NexiumProfile } from '../types'

export function ProfileEditor({ profile, onUpdate }: { profile: NexiumProfile; onUpdate: (p: NexiumProfile) => void }) {
  const username = profile.user.name
  const [form, setForm] = useState({
    headline: profile.headline ?? '',
    title: profile.title ?? '',
    availability: profile.availability,
    lookingFor: profile.lookingFor,
    isVisible: profile.isVisible,
    location: profile.location ?? '',
    timezone: profile.timezone ?? '',
    activeHours: profile.activeHours ?? '',
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/discovery/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          title: form.title || undefined,
          headline: form.headline || undefined,
          location: form.location || null,
          timezone: form.timezone || null,
          activeHours: form.activeHours || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      toast({ title: 'Discovery profile updated' })
      onUpdate({ ...profile, ...form })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const toggleLookingFor = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      lookingFor: prev.lookingFor.includes(tag)
        ? prev.lookingFor.filter((t) => t !== tag)
        : [...prev.lookingFor, tag],
    }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-primary">@{username}</span>
          {profile.isVisible ? (
            <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-500/30 bg-green-500/10">
              <Eye className="w-3 h-3" /> Visible
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
              <EyeOff className="w-3 h-3" /> Hidden
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setForm((p) => ({ ...p, isVisible: !p.isVisible }))}
          className="text-xs"
        >
          {form.isVisible ? <EyeOff className="w-3 h-3 mr-1.5" /> : <Eye className="w-3 h-3 mr-1.5" />}
          {form.isVisible ? 'Hide profile' : 'Make visible'}
        </Button>
      </div>

      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-xs text-muted-foreground">
          Your Discovery identity uses your Emberly username <span className="font-mono text-primary">@{username}</span>. To change it, update your profile username in the Profile tab.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Availability</Label>
        <Select
          value={form.availability}
          onValueChange={(v) => setForm((p) => ({ ...p, availability: v }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(NEXIUM_AVAILABILITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label as string}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Senior Backend Engineer, UX Designer"
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">Your job title or role</p>
      </div>

      <div className="space-y-2">
        <Label>Headline</Label>
        <Input
          value={form.headline}
          onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
          placeholder="e.g. Building open-source dev tools & scaling distributed systems"
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">A short tagline about what you do or what you're working on</p>
      </div>

      <div className="space-y-2">
        <Label>Looking for</Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(NEXIUM_LOOKING_FOR_LABELS).map(([value, label]) => (
            <Badge
              key={value}
              variant={form.lookingFor.includes(value) ? 'default' : 'outline'}
              className="cursor-pointer text-xs select-none"
              onClick={() => toggleLookingFor(value)}
            >
              {form.lookingFor.includes(value) && <CheckCircle className="w-3 h-3 mr-1" />}
              {label as string}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="location" className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Location
          </Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            placeholder="e.g. London, UK or Remote"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="timezone" className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Timezone
          </Label>
          <Input
            id="timezone"
            value={form.timezone}
            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
            placeholder="e.g. UTC+1, EST, Asia/Tokyo"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="activeHours" className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Active hours
          </Label>
          <Input
            id="activeHours"
            value={form.activeHours}
            onChange={(e) => setForm((p) => ({ ...p, activeHours: e.target.value }))}
            placeholder="e.g. 9am–5pm weekdays, Evenings & weekends"
          />
        </div>
      </div>

      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save changes
      </Button>
    </div>
  )
}
