'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Textarea } from '@/packages/components/ui/textarea'
import { Badge } from '@/packages/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { useToast } from '@/packages/hooks/use-toast'
import { Loader2, Plus, Trash2, Send, Briefcase, Building2 } from 'lucide-react'
import {
  NEXIUM_OPPORTUNITY_TYPE_LABELS,
  NEXIUM_OPPORTUNITY_STATUS_LABELS,
} from '@/packages/lib/nexium/constants'
import { OPP_TYPE_STYLE, OPP_STATUS_STYLE, EMPTY_OPP_FORM } from '../constants'
import type { Opportunity } from '../types'

export function OpportunitiesPanel() {
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
              <Select
                value={form.type}
                onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NEXIUM_OPPORTUNITY_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
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
