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
  Search,
  GitFork,
  Lock,
  RotateCw,
  Info,
} from 'lucide-react'
import { SiDiscord, SiGithub as SiGithubIcon } from 'react-icons/si'
import { SkillIcon } from './skill-icons'
import { SignalCard } from './signal-card'
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
  imageUrl: string | null
  metadata: Record<string, unknown> | null
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

// ── Shared display helpers ───────────────────────────────────────────────────

function SkillLevelBar({ level }: { level: string }) {
  const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
  const rank = levels.indexOf(level)
  const colorMap: Record<string, string> = {
    BEGINNER: 'bg-blue-500',
    INTERMEDIATE: 'bg-green-500',
    ADVANCED: 'bg-orange-500',
    EXPERT: 'bg-purple-500',
  }
  return (
    <div className="flex items-center gap-0.5" title={NEXIUM_SKILL_LEVEL_LABELS[level as keyof typeof NEXIUM_SKILL_LEVEL_LABELS]}>
      {levels.map((_, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= rank ? colorMap[level] : 'bg-muted-foreground/20'}`} />
      ))}
    </div>
  )
}

// ── GitHub repo picker types ──────────────────────────────────────────────────

type GithubRepoPick = {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  private: boolean
  fork: boolean
  archived: boolean
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  pushed_at: string
  owner: { login: string; avatar_url: string }
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Rust: '#dea584',
  Go: '#00ADD8', Java: '#b07219', 'C#': '#178600', 'C++': '#f34b7d', Swift: '#F05138',
  Kotlin: '#A97BFF', Ruby: '#701516', PHP: '#4F5D95', Vue: '#41b883', Svelte: '#ff3e00',
  HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051',
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

      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No skills added yet.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(
            skills.reduce<Record<string, typeof skills>>((acc, s) => {
              const cat = s.category || 'General'
              acc[cat] = [...(acc[cat] ?? []), s]
              return acc
            }, {})
          ).map(([cat, catSkills]) => (
            <div key={cat}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">{cat}</p>
              <div className="flex flex-wrap gap-2">
                {catSkills.map((skill) => (
                  <div key={skill.id} className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
                    <SkillIcon name={skill.name} className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-sm font-medium">{skill.name}</span>
                    <SkillLevelBar level={skill.level} />
                    {skill.yearsExperience != null && (
                      <span className="text-xs text-muted-foreground border-l border-border/50 pl-1.5">{skill.yearsExperience}y</span>
                    )}
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="opacity-0 group-hover:opacity-100 ml-0.5 text-muted-foreground hover:text-destructive transition-all"
                      aria-label="Remove skill"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── GitHub Repo Picker ────────────────────────────────────────────────────────

function GitHubRepoPicker({
  onSelectMultiple,
  onManual,
  githubUsername,
}: {
  onSelectMultiple: (repos: GithubRepoPick[]) => void
  onManual: () => void
  githubUsername?: string | null
}) {
  const [repos, setRepos] = useState<GithubRepoPick[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showForks, setShowForks] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  const fetchRepos = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSelectedIds(new Set())
    try {
      const res = await fetch('/api/discovery/repos')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load repos')
      setRepos(json.data ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRepos() }, [fetchRepos])

  const owners = Array.from(new Set(repos.map((r) => r.owner.login))).sort((a, b) => {
    if (a === githubUsername) return -1
    if (b === githubUsername) return 1
    return a.localeCompare(b)
  })

  const filtered = repos.filter((r) => {
    if (!showForks && r.fork) return false
    if (r.archived) return false
    if (selectedOwner && r.owner.login !== selectedOwner) return false
    const q = search.toLowerCase()
    return !q || r.full_name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
  })

  const toggleRepo = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCount = selectedIds.size

  const handleSubmit = () => {
    const selected = repos.filter((r) => selectedIds.has(r.id))
    if (selected.length > 0) onSelectMultiple(selected)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading your repositories…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button size="sm" variant="outline" onClick={fetchRepos}>
          <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
        <a
          href="/api/auth/link/github"
          className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
        >
          Re-authorize GitHub to grant access to more orgs
        </a>
        <button onClick={onManual} className="text-xs text-muted-foreground underline underline-offset-2">
          Enter URL manually instead
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Info callout */}
      <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
        <span>
          Your GitHub repositories are shown here because your account is linked. Signals aren't limited to GitHub you can also add deployed apps, open source contributions, shipped products, and more.{' '}
          <button onClick={onManual} className="text-primary/80 underline underline-offset-2 hover:text-primary transition-colors">
            Add a different type of signal instead.
          </button>
        </span>
      </div>

      {/* Search + org dropdown + forks + refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories…"
            className="h-8 pl-8 text-sm"
          />
        </div>

        {owners.length > 1 && (
          <select
            value={selectedOwner}
            onChange={(e) => { setSelectedOwner(e.target.value); setSelectedIds(new Set()) }}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground max-w-[130px] shrink-0 cursor-pointer"
          >
            <option value="">All owners</option>
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}{owner === githubUsername ? ' (you)' : ''}
              </option>
            ))}
          </select>
        )}

        <Button
          size="sm"
          variant={showForks ? 'secondary' : 'ghost'}
          className="h-8 text-xs shrink-0"
          onClick={() => setShowForks((v) => !v)}
        >
          <GitFork className="w-3 h-3 mr-1" /> Forks
        </Button>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={fetchRepos} title="Refresh">
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Repo list with checkboxes */}
      <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {search ? 'No matching repositories found.' : 'No repositories found.'}
          </p>
        )}
        {filtered.map((repo) => {
          const isSelected = selectedIds.has(repo.id)
          return (
            <button
              key={repo.id}
              type="button"
              onClick={() => toggleRepo(repo.id)}
              className={`group w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left select-none ${
                isSelected
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border/40 bg-background/60 hover:bg-accent hover:border-border'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                isSelected ? 'bg-primary border-primary' : 'border-border/60 group-hover:border-border'
              }`}>
                {isSelected && (
                  <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <img
                src={repo.owner.avatar_url}
                alt={repo.owner.login}
                className="w-5 h-5 rounded-full shrink-0 ring-1 ring-border/40"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-medium truncate text-foreground">
                    <span className="text-muted-foreground font-normal">{repo.owner.login}/</span>{repo.name}
                  </span>
                  {repo.private && <Lock className="w-2.5 h-2.5 text-muted-foreground/60 shrink-0" />}
                  {repo.fork && <GitFork className="w-2.5 h-2.5 text-muted-foreground/60 shrink-0" />}
                </div>
                {repo.description && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{repo.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: LANGUAGE_COLORS[repo.language] ?? '#888' }}
                    />
                    {repo.language}
                  </span>
                )}
                {repo.stargazers_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5" />
                    {repo.stargazers_count >= 1000 ? `${(repo.stargazers_count / 1000).toFixed(1)}k` : repo.stargazers_count}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[10px] text-muted-foreground">{filtered.length} repo{filtered.length !== 1 ? 's' : ''}</span>
          <a
            href="/api/auth/link/github"
            className="text-[10px] text-primary/70 underline underline-offset-2 hover:text-primary"
            title="Re-connect GitHub to grant access to additional organizations"
          >
            Grant org access
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onManual} className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground whitespace-nowrap">
            Enter manually
          </button>
          {selectedCount > 0 && (
            <Button size="sm" className="h-7 text-xs px-3" onClick={handleSubmit}>
              Add {selectedCount} signal{selectedCount !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Signals panel ─────────────────────────────────────────────────────────────

function SignalsPanel({ profile }: { profile: NexiumProfile }) {
  const [signals, setSignals] = useState(profile.signals)
  const [mode, setMode] = useState<'idle' | 'picker' | 'manual' | 'submitting'>('idle')
  const [form, setForm] = useState({ type: 'GITHUB_REPO', title: '', url: '', description: '', imageUrl: '' })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const hasGitHub = profile.user.linkedAccounts.some((a) => a.provider === 'github')
  const githubUsername = profile.user.linkedAccounts.find((a) => a.provider === 'github')?.providerUsername ?? null

  // When GitHub is linked, go straight to picker; otherwise show the manual form
  const handleOpen = () => setMode(hasGitHub ? 'picker' : 'manual')

  const handleRepoMultiSelect = async (repos: GithubRepoPick[]) => {
    setMode('submitting')
    let added = 0
    for (const repo of repos) {
      try {
        const res = await fetch('/api/discovery/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'GITHUB_REPO',
            title: repo.full_name,
            url: repo.html_url,
            description: repo.description || undefined,
          }),
        })
        const json = await res.json()
        if (res.ok) {
          setSignals((prev) => [...prev, json.data])
          added++
        }
      } catch {
        // continue with remaining repos
      }
    }
    setMode('idle')
    if (added > 0) toast({ title: `${added} signal${added !== 1 ? 's' : ''} added!` })
    if (added < repos.length) toast({ title: 'Some signals failed to save', variant: 'destructive' })
  }

  const resetForm = () => {
    setMode('idle')
    setForm({ type: 'GITHUB_REPO', title: '', url: '', description: '', imageUrl: '' })
  }

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
          imageUrl: form.imageUrl || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to add signal')
      setSignals((prev) => [...prev, json.data])
      resetForm()
      toast({ title: 'Signal added!' })
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
      {(mode === 'idle' || mode === 'submitting') && (
          <Button size="sm" variant="outline" onClick={handleOpen} disabled={mode === 'submitting'}>
            {mode === 'submitting'
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...</>
              : <><Plus className="w-3.5 h-3.5 mr-1.5" /> Add signal</>}
          </Button>
        )}
      </div>

      {/* GitHub Repo Picker mode */}
      {mode === 'picker' && (
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SiGithubIcon className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium">Select a repository</span>
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setMode('idle')}>Cancel</Button>
          </div>
          <GitHubRepoPicker
            onSelectMultiple={handleRepoMultiSelect}
            onManual={() => setMode('manual')}
            githubUsername={githubUsername}
          />
        </div>
      )}

      {/* Manual form mode — for non-GitHub signals or when picker unavailable */}
      {mode === 'manual' && (
        <form onSubmit={addSignal} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Add signal manually</span>
            <div className="flex items-center gap-2">
              {hasGitHub && (
                <Button size="sm" variant="ghost" className="h-7 text-xs" type="button" onClick={() => setMode('picker')}>
                  <SiGithubIcon className="w-3 h-3 mr-1.5" /> Browse repos
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 text-xs" type="button" onClick={() => setMode('idle')}>Cancel</Button>
            </div>
          </div>

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

          {/* GitHub repo picker shortcut removed — use Browse repos button in header instead */}

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
              placeholder="Brief description of what you built or contributed…"
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {form.type !== 'GITHUB_REPO' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Logo / Banner URL</Label>
              <Input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="h-8 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Optional image shown on your signal card.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Add signal
            </Button>
          </div>
        </form>
      )}

      {/* Signal list */}
      <div className="space-y-2">
        {signals.length === 0 && (mode === 'idle' || mode === 'submitting') && (
          <div className="rounded-xl border border-dashed border-border/60 p-6 text-center space-y-2">
            <SiGithubIcon className="w-6 h-6 text-muted-foreground/50 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">No signals yet</p>
            <p className="text-xs text-muted-foreground/70">
              Add links to repos, apps, and contributions to build trust with employers.
            </p>
            <Button size="sm" variant="outline" className="mt-2" onClick={handleOpen}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add your first signal
            </Button>
          </div>
        )}
        {signals.map((signal) => (
          <div key={signal.id} className="group relative">
            <SignalCard signal={signal} />
            <button
              onClick={() => removeSignal(signal.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-md bg-background/90 border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-all z-10 shadow-sm"
              aria-label="Remove signal"
            >
              <Trash2 className="w-3 h-3" />
            </button>
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

export type NexiumSection = 'profile' | 'skills' | 'signals' | 'opportunities' | 'applications'

export const TALENT_SECTIONS: { value: NexiumSection; label: string; icon: string }[] = [
  { value: 'profile', label: 'Profile', icon: 'User' },
  { value: 'skills', label: 'Skills', icon: 'Sparkles' },
  { value: 'signals', label: 'Signals', icon: 'Zap' },
  { value: 'opportunities', label: 'Opportunities', icon: 'Briefcase' },
  { value: 'applications', label: 'Applications', icon: 'ClipboardList' },
]

export function NexiumDashboard({
  activeSection: controlledSection,
  onSectionChange,
}: {
  activeSection?: NexiumSection
  onSectionChange?: (section: NexiumSection) => void
} = {}) {
  const [profile, setProfile] = useState<NexiumProfile | null | 'loading'>('loading')
  const [internalSection, setInternalSection] = useState<NexiumSection>('profile')
  const { toast } = useToast()

  const controlled = controlledSection !== undefined
  const activeSection = controlled ? controlledSection : internalSection
  const setActiveSection = (s: NexiumSection) => {
    if (controlled) onSectionChange?.(s)
    else setInternalSection(s)
  }

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

      {/* Section nav — hidden when sidebar controls the section externally */}
      {!controlled && (
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
      )}

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
