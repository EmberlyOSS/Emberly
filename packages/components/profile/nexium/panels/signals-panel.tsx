'use client'

import { useState } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Textarea } from '@/packages/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { useToast } from '@/packages/hooks/use-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { SiGithub as SiGithubIcon } from 'react-icons/si'
import { NEXIUM_SIGNAL_TYPE_LABELS } from '@/packages/lib/nexium/constants'
import { SignalCard } from '../../signal-card'
import { GitHubRepoPicker } from './github-repo-picker'
import type { NexiumProfile, GithubRepoPick } from '../types'

export function SignalsPanel({ profile }: { profile: NexiumProfile }) {
  const [signals, setSignals] = useState(profile.signals)
  const [mode, setMode] = useState<'idle' | 'picker' | 'manual' | 'submitting'>('idle')
  const [form, setForm] = useState({ type: 'GITHUB_REPO', title: '', url: '', description: '', imageUrl: '' })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const hasGitHub = profile.user.linkedAccounts.some((a) => a.provider === 'github')
  const githubUsername = profile.user.linkedAccounts.find((a) => a.provider === 'github')?.providerUsername ?? null

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
        // continue
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
              <Select
                value={form.type}
                onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NEXIUM_SIGNAL_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
