'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Textarea } from '@/packages/components/ui/textarea'
import { Badge } from '@/packages/components/ui/badge'
import { useToast } from '@/packages/hooks/use-toast'
import { ScrollIndicator } from '@/packages/components/ui/scroll-indicator'
import {
  Zap,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  Star,
  CheckCircle,
  MapPin,
  Clock,
  Globe,
  Github,
  Twitter,
  MessageCircle,
  Briefcase,
  Send,
  Building2,
} from 'lucide-react'
import {
  NEXIUM_AVAILABILITY_LABELS,
  NEXIUM_SKILL_LEVEL_LABELS,
  NEXIUM_SIGNAL_TYPE_LABELS,
  NEXIUM_LOOKING_FOR,
  NEXIUM_LOOKING_FOR_LABELS,
  NEXIUM_SKILL_CATEGORIES,
  NEXIUM_APPLICATION_STATUS_LABELS,
  NEXIUM_OPPORTUNITY_TYPE_LABELS,
  NEXIUM_OPPORTUNITY_STATUS_LABELS,
} from '@/packages/lib/nexium/constants'

// ── Types ─────────────────────────────────────────────────────────────────────

type NexiumSkill = {
  id: string
  name: string
  level: string
  category: string | null
  yearsExperience: number | null
  sortOrder: number
}

type NexiumSignal = {
  id: string
  type: string
  title: string
  url: string | null
  description: string | null
  skills: string[]
  verified: boolean
  sortOrder: number
}

type NexiumProfile = {
  id: string
  title: string | null
  headline: string | null
  availability: string
  lookingFor: string[]
  location: string | null
  timezone: string | null
  activeHours: string | null
  isVisible: boolean
  skills: NexiumSkill[]
  signals: NexiumSignal[]
  user: {
    name: string | null
    fullName: string | null
    image: string | null
    urlId: string
    vanityId: string | null
    bio: string | null
    website: string | null
    twitter: string | null
    github: string | null
    discord: string | null
    showLinkedAccounts: boolean
    linkedAccounts: { provider: string; providerUsername: string | null }[]
  }
}

// ── Setup form ────────────────────────────────────────────────────────────────

function NexiumSetup({ onCreated }: { onCreated: (profile: NexiumProfile) => void }) {
  const [headline, setHeadline] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/discovery/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: headline.trim() || undefined,
          title: title.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create profile')
      toast({ title: 'Discovery profile created!', description: 'Your talent profile is now live.' })
      onCreated(json.data)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Zap className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">Activate your Discovery profile</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get discovered on Discovery, the talent discovery layer of Emberly. Your Emberly username will be used as your public identity.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nexium-title">Title</Label>
          <Input
            id="nexium-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Backend Engineer, UX Designer"
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground">Your job title or role</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nexium-headline">Headline</Label>
          <Input
            id="nexium-headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Building open-source dev tools & scaling distributed systems"
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground">A short tagline about what you do or what you're working on</p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Activate Discovery Profile
        </Button>
      </form>
    </div>
  )
}

// ── Profile editor ────────────────────────────────────────────────────────────

function ProfileEditor({ profile, onUpdate }: { profile: NexiumProfile; onUpdate: (p: NexiumProfile) => void }) {
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
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={form.availability}
          onChange={(e) => setForm((p) => ({ ...p, availability: e.target.value }))}
        >
          {Object.entries(NEXIUM_AVAILABILITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
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
              {label}
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

// ── Skills panel ──────────────────────────────────────────────────────────────

function SkillsPanel({ profile }: { profile: NexiumProfile }) {
  const [skills, setSkills] = useState(profile.skills)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', level: 'INTERMEDIATE', category: '', yearsExperience: '' })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/discovery/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          level: form.level,
          category: form.category || undefined,
          yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to add skill')
      setSkills((prev) => [...prev, json.data])
      setForm({ name: '', level: 'INTERMEDIATE', category: '', yearsExperience: '' })
      setAdding(false)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const removeSkill = async (id: string) => {
    try {
      await fetch(`/api/discovery/skills/${id}`, { method: 'DELETE' })
      setSkills((prev) => prev.filter((s) => s.id !== id))
    } catch {
      toast({ title: 'Error', description: 'Failed to remove skill', variant: 'destructive' })
    }
  }

  const levelColors: Record<string, string> = {
    BEGINNER: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
    INTERMEDIATE: 'text-green-500 border-green-500/30 bg-green-500/10',
    ADVANCED: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
    EXPERT: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{skills.length} skill{skills.length !== 1 ? 's' : ''} added</p>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add skill
          </Button>
        )}
      </div>

      {adding && (
        <form onSubmit={addSkill} className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Skill name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. React, Blender, Solidity"
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Level *</Label>
              <select
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={form.level}
                onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
              >
                {Object.entries(NEXIUM_SKILL_LEVEL_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <select
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                <option value="">None</option>
                {NEXIUM_SKILL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Years experience</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={form.yearsExperience}
                onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Add
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">No skills added yet.</p>
        )}
        {skills.map((skill) => (
          <div key={skill.id} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary/30 transition-colors">
            <span className="text-sm font-medium">{skill.name}</span>
            <Badge variant="outline" className={`text-xs ${levelColors[skill.level] ?? ''}`}>
              {NEXIUM_SKILL_LEVEL_LABELS[skill.level as keyof typeof NEXIUM_SKILL_LEVEL_LABELS]}
            </Badge>
            {skill.yearsExperience != null && (
              <span className="text-xs text-muted-foreground">{skill.yearsExperience}y</span>
            )}
            <button
              onClick={() => removeSkill(skill.id)}
              className="opacity-0 group-hover:opacity-100 ml-1 text-muted-foreground hover:text-destructive transition-all"
              aria-label="Remove skill"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Signals panel ─────────────────────────────────────────────────────────────

function SignalsPanel({ profile }: { profile: NexiumProfile }) {
  const [signals, setSignals] = useState(profile.signals)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ type: 'GITHUB_REPO', title: '', url: '', description: '' })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const addSignal = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/discovery/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          url: form.url || undefined,
          description: form.description || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to add signal')
      setSignals((prev) => [...prev, json.data])
      setForm({ type: 'GITHUB_REPO', title: '', url: '', description: '' })
      setAdding(false)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const removeSignal = async (id: string) => {
    try {
      await fetch(`/api/discovery/signals/${id}`, { method: 'DELETE' })
      setSignals((prev) => prev.filter((s) => s.id !== id))
    } catch {
      toast({ title: 'Error', description: 'Failed to remove signal', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{signals.length} proof-of-skill signal{signals.length !== 1 ? 's' : ''}</p>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add signal
          </Button>
        )}
      </div>

      {adding && (
        <form onSubmit={addSignal} className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type *</Label>
              <select
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                {Object.entries(NEXIUM_SIGNAL_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="My open source project"
                required
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">URL</Label>
            <Input
              type="url"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://github.com/..."
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of what you built or contributed..."
              rows={2}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Add signal
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {signals.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">No signals yet. Add links to your work to build trust.</p>
        )}
        {signals.map((signal) => (
          <div key={signal.id} className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-primary/80">
                  {NEXIUM_SIGNAL_TYPE_LABELS[signal.type as keyof typeof NEXIUM_SIGNAL_TYPE_LABELS]}
                </span>
                {signal.verified && (
                  <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-500/30 bg-green-500/10">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium truncate">{signal.title}</p>
              {signal.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{signal.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {signal.url && (
                <a
                  href={signal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => removeSignal(signal.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                aria-label="Remove signal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Applications panel ────────────────────────────────────────────────────────

type MyApplication = {
  id: string
  status: string
  message: string
  appliedAt: string
  opportunity: {
    id: string
    title: string
    type: string
    status: string
    remote: boolean
    location: string | null
    postedBy: { name: string | null; urlId: string }
  }
}

const APP_STATUS_STYLE: Record<string, string> = {
  PENDING: 'text-yellow-600 border-yellow-500/30 bg-yellow-500/10',
  VIEWED: 'text-blue-600 border-blue-500/30 bg-blue-500/10',
  SHORTLISTED: 'text-purple-600 border-purple-500/30 bg-purple-500/10',
  ACCEPTED: 'text-green-600 border-green-500/30 bg-green-500/10',
  REJECTED: 'text-destructive border-destructive/30 bg-destructive/10',
  WITHDRAWN: 'text-muted-foreground border-border',
}

function ApplicationsPanel() {
  const [apps, setApps] = useState<MyApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch('/api/discovery/applications')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setApps(json.data?.applications ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load applications', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchApps() }, [fetchApps])

  const withdraw = async (opportunityId: string) => {
    setWithdrawing(opportunityId)
    try {
      const res = await fetch(`/api/discovery/opportunities/${opportunityId}/apply`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to withdraw')
      }
      setApps((prev) =>
        prev.map((a) => a.opportunity.id === opportunityId ? { ...a, status: 'WITHDRAWN' } : a)
      )
      toast({ title: 'Application withdrawn' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setWithdrawing(null)
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading applications…
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="py-8 text-center space-y-2">
        <Send className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-sm font-medium">No applications yet</p>
        <p className="text-xs text-muted-foreground">Browse opportunities and apply to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {apps.length} application{apps.length !== 1 ? 's' : ''}
      </p>
      {apps.map((app) => (
        <div key={app.id} className="p-4 rounded-lg border border-border bg-background space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{app.opportunity.title}</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${APP_STATUS_STYLE[app.status] ?? ''}`}
                >
                  {NEXIUM_APPLICATION_STATUS_LABELS[app.status as keyof typeof NEXIUM_APPLICATION_STATUS_LABELS]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span>{NEXIUM_OPPORTUNITY_TYPE_LABELS[app.opportunity.type as keyof typeof NEXIUM_OPPORTUNITY_TYPE_LABELS]}</span>
                {app.opportunity.remote
                  ? <span>Remote</span>
                  : app.opportunity.location && <span>{app.opportunity.location}</span>
                }
                <span>by @{app.opportunity.postedBy.name}</span>
                <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
              </div>
              {app.message && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 italic">
                  &ldquo;{app.message}&rdquo;
                </p>
              )}
            </div>
            {(app.status === 'PENDING' || app.status === 'VIEWED') && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-destructive shrink-0"
                disabled={withdrawing === app.opportunity.id}
                onClick={() => withdraw(app.opportunity.id)}
              >
                {withdrawing === app.opportunity.id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : 'Withdraw'
                }
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Opportunities panel ───────────────────────────────────────────────────────

type Opportunity = {
  id: string
  title: string
  description: string
  type: string
  status: string
  remote: boolean
  location: string | null
  requiredSkills: string[]
  budgetMin: number | null
  budgetMax: number | null
  currency: string
  timeCommitment: string | null
  deadline: string | null
  createdAt: string
  postedBy: { name: string | null; urlId: string }
  _count: { applications: number }
}

const OPP_TYPE_STYLE: Record<string, string> = {
  FULL_TIME: 'text-blue-600 border-blue-500/30 bg-blue-500/10',
  PART_TIME: 'text-purple-600 border-purple-500/30 bg-purple-500/10',
  CONTRACT: 'text-orange-600 border-orange-500/30 bg-orange-500/10',
  COLLAB: 'text-green-600 border-green-500/30 bg-green-500/10',
  BOUNTY: 'text-yellow-600 border-yellow-500/30 bg-yellow-500/10',
}

const OPP_STATUS_STYLE: Record<string, string> = {
  DRAFT: 'text-muted-foreground border-border',
  OPEN: 'text-green-600 border-green-500/30 bg-green-500/10',
  FILLED: 'text-blue-600 border-blue-500/30 bg-blue-500/10',
  CLOSED: 'text-muted-foreground',
}

const EMPTY_OPP_FORM = {
  title: '',
  description: '',
  type: 'CONTRACT',
  remote: true,
  location: '',
  requiredSkills: '',
  budgetMin: '',
  budgetMax: '',
  currency: 'USD',
  timeCommitment: '',
  status: 'OPEN',
}

function OpportunitiesPanel() {
  const [view, setView] = useState<'browse' | 'mine' | 'create'>('browse')
  const [browsing, setBrowsing] = useState<Opportunity[]>([])
  const [myOpps, setMyOpps] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [mineLoaded, setMineLoaded] = useState(false)
  const [applyingTo, setApplyingTo] = useState<string | null>(null)
  const [applyMessage, setApplyMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY_OPP_FORM)
  const { toast } = useToast()

  const fetchBrowse = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/discovery/opportunities')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setBrowsing(json.data?.opportunities ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load opportunities', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchMine = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/discovery/opportunities?mine=true')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setMyOpps(json.data?.opportunities ?? [])
      setMineLoaded(true)
    } catch {
      toast({ title: 'Error', description: 'Failed to load your opportunities', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchBrowse() }, [fetchBrowse])

  const switchView = (v: 'browse' | 'mine' | 'create') => {
    setView(v)
    if (v === 'mine' && !mineLoaded) fetchMine()
  }

  const handleApply = async (opportunityId: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/discovery/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: applyMessage }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to apply')
      toast({ title: 'Application submitted!' })
      setApplyingTo(null)
      setApplyMessage('')
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const skills = form.requiredSkills
        ? form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : []
      const res = await fetch('/api/discovery/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          type: form.type,
          remote: form.remote,
          location: form.location || undefined,
          requiredSkills: skills,
          budgetMin: form.budgetMin ? Math.round(Number(form.budgetMin) * 100) : undefined,
          budgetMax: form.budgetMax ? Math.round(Number(form.budgetMax) * 100) : undefined,
          currency: form.currency,
          timeCommitment: form.timeCommitment || undefined,
          status: form.status,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create')
      toast({ title: 'Opportunity posted!' })
      setMineLoaded(false)
      setForm(EMPTY_OPP_FORM)
      switchView('mine')
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/discovery/opportunities/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setMyOpps((prev) => prev.filter((o) => o.id !== id))
      toast({ title: 'Opportunity deleted' })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  const formatBudget = (opp: Opportunity) => {
    if (!opp.budgetMin && !opp.budgetMax) return null
    const fmt = (cents: number) => `${opp.currency} ${(cents / 100).toLocaleString()}`
    if (opp.budgetMin && opp.budgetMax) return `${fmt(opp.budgetMin)} – ${fmt(opp.budgetMax)}`
    if (opp.budgetMax) return `Up to ${fmt(opp.budgetMax)}`
    return `From ${fmt(opp.budgetMin!)}`
  }

  const renderOppCard = (opp: Opportunity, isOwn: boolean) => (
    <div key={opp.id} className="p-4 rounded-lg border border-border bg-background space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{opp.title}</span>
            <Badge variant="outline" className={`text-xs ${OPP_TYPE_STYLE[opp.type] ?? ''}`}>
              {NEXIUM_OPPORTUNITY_TYPE_LABELS[opp.type as keyof typeof NEXIUM_OPPORTUNITY_TYPE_LABELS]}
            </Badge>
            {isOwn && (
              <Badge variant="outline" className={`text-xs ${OPP_STATUS_STYLE[opp.status] ?? ''}`}>
                {NEXIUM_OPPORTUNITY_STATUS_LABELS[opp.status as keyof typeof NEXIUM_OPPORTUNITY_STATUS_LABELS]}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{opp.description}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
            {opp.remote ? <span>Remote</span> : opp.location && <span>{opp.location}</span>}
            {formatBudget(opp) && <span>{formatBudget(opp)}</span>}
            {opp.timeCommitment && <span>{opp.timeCommitment}</span>}
            {isOwn
              ? <span>{opp._count.applications} applicant{opp._count.applications !== 1 ? 's' : ''}</span>
              : <span>by @{opp.postedBy.name}</span>
            }
          </div>
          {opp.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {opp.requiredSkills.slice(0, 6).map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-full border border-border text-xs bg-background">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {isOwn && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => handleDelete(opp.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {!isOwn && (
        applyingTo === opp.id ? (
          <div className="space-y-2 pt-1 border-t border-border/50">
            <Textarea
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Introduce yourself and explain why you're a good fit…"
              rows={3}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={submitting || !applyMessage.trim()}
                onClick={() => handleApply(opp.id)}
              >
                {submitting
                  ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5 mr-1.5" />
                }
                Submit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setApplyingTo(null); setApplyMessage('') }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setApplyingTo(opp.id)}
          >
            Apply
          </Button>
        )
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Sub-nav */}
      <div className="flex gap-1 p-1 glass-subtle rounded-lg w-fit">
        {(['browse', 'mine', 'create'] as const).map((v) => (
          <button
            key={v}
            onClick={() => switchView(v)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
              view === v
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {v === 'browse' ? 'Browse' : v === 'mine' ? 'My Postings' : '+ Post'}
          </button>
        ))}
      </div>

      {/* Browse view */}
      {view === 'browse' && (
        loading ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…
          </div>
        ) : browsing.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Briefcase className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">No open opportunities</p>
            <p className="text-xs text-muted-foreground">Be the first to post one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {browsing.map((opp) => renderOppCard(opp, false))}
          </div>
        )
      )}

      {/* My postings view */}
      {view === 'mine' && (
        loading ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…
          </div>
        ) : myOpps.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Building2 className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">No postings yet</p>
            <p className="text-xs text-muted-foreground">Post an opportunity to find collaborators or team members.</p>
            <Button size="sm" variant="outline" onClick={() => switchView('create')}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Post opportunity
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {myOpps.map((opp) => renderOppCard(opp, true))}
          </div>
        )
      )}

      {/* Create form */}
      {view === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Looking for a backend engineer"
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Type *</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                {Object.entries(NEXIUM_OPPORTUNITY_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="OPEN">Open</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Description *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the role, project, and what you're looking for…"
                rows={3}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Required skills</Label>
              <Input
                value={form.requiredSkills}
                onChange={(e) => setForm((p) => ({ ...p, requiredSkills: e.target.value }))}
                placeholder="React, Node.js, TypeScript"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">Comma-separated</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Time commitment</Label>
              <Input
                value={form.timeCommitment}
                onChange={(e) => setForm((p) => ({ ...p, timeCommitment: e.target.value }))}
                placeholder="e.g. 10–20 hrs/week, Full-time"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Budget min ({form.currency})</Label>
              <Input
                type="number"
                min={0}
                value={form.budgetMin}
                onChange={(e) => setForm((p) => ({ ...p, budgetMin: e.target.value }))}
                placeholder="0"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Budget max ({form.currency})</Label>
              <Input
                type="number"
                min={0}
                value={form.budgetMax}
                onChange={(e) => setForm((p) => ({ ...p, budgetMax: e.target.value }))}
                placeholder="0"
                className="text-sm"
              />
            </div>

            <div className="col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.remote}
                  onChange={(e) => setForm((p) => ({ ...p, remote: e.target.checked }))}
                  className="rounded border-input"
                />
                Remote
              </label>
              {!form.remote && (
                <Input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="Location"
                  className="text-sm flex-1"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={creating || !form.title || !form.description}>
              {creating && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Post opportunity
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => switchView('browse')}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Main dashboard component ──────────────────────────────────────────────────

export function NexiumDashboard() {
  const [profile, setProfile] = useState<NexiumProfile | null | 'loading'>('loading')
  const [activeSection, setActiveSection] = useState<'profile' | 'skills' | 'signals' | 'opportunities' | 'applications'>('profile')
  const { toast } = useToast()

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/discovery/profile')
      if (res.status === 404) {
        setProfile(null)
        return
      }
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setProfile(json.data)
    } catch {
      toast({ title: 'Error', description: 'Failed to load Discovery profile', variant: 'destructive' })
      setProfile(null)
    }
  }, [toast])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  if (profile === 'loading') {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading Discovery profile…
      </div>
    )
  }

  if (!profile) {
    return <NexiumSetup onCreated={(p) => setProfile(p as any)} />
  }

  const sections = [
    { id: 'profile', label: 'Profile' },
    { id: 'skills', label: `Skills (${profile.skills.length})` },
    { id: 'signals', label: `Signals (${profile.signals.length})` },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'applications', label: 'Applications' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">@{profile.user.name}</p>
          {profile.headline && (
            <p className="text-xs text-muted-foreground">{profile.headline}</p>
          )}
        </div>
        <Badge
          variant="outline"
          className={`ml-auto text-xs ${
            profile.availability === 'OPEN'
              ? 'text-green-600 border-green-500/30 bg-green-500/10'
              : profile.availability === 'LIMITED'
              ? 'text-yellow-600 border-yellow-500/30 bg-yellow-500/10'
              : 'text-muted-foreground'
          }`}
        >
          <Star className="w-3 h-3 mr-1" />
          {NEXIUM_AVAILABILITY_LABELS[profile.availability as keyof typeof NEXIUM_AVAILABILITY_LABELS]}
        </Badge>
      </div>

      {/* Section nav */}
      <ScrollIndicator className="glass-subtle rounded-lg p-1">
        <div className="flex gap-1 w-max">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeSection === s.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </ScrollIndicator>

      {/* Section content */}
      {activeSection === 'profile' && (
        <ProfileEditor
          profile={profile}
          onUpdate={(updated) => setProfile((prev) => prev && { ...prev, ...updated })}
        />
      )}
      {activeSection === 'skills' && <SkillsPanel profile={profile} />}
      {activeSection === 'signals' && <SignalsPanel profile={profile} />}
      {activeSection === 'opportunities' && <OpportunitiesPanel />}
      {activeSection === 'applications' && <ApplicationsPanel />}
    </div>
  )
}
