'use client'

import { useState } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { useToast } from '@/packages/hooks/use-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import {
  NEXIUM_SKILL_LEVEL_LABELS,
  NEXIUM_SKILL_CATEGORIES,
} from '@/packages/lib/nexium/constants'
import { SkillIcon } from '../../skill-icons'
import type { NexiumProfile } from '../types'

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

export function SkillsPanel({ profile }: { profile: NexiumProfile }) {
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
              <Select
                value={form.level}
                onValueChange={(v) => setForm((p) => ({ ...p, level: v }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NEXIUM_SKILL_LEVEL_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {NEXIUM_SKILL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
