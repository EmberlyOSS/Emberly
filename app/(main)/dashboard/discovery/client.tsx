'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  ChevronRight,
  Shield,
  Zap,
  Globe,
  Key,
  HardDrive,
} from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import { Input } from '@/packages/components/ui/input'
import { useToast } from '@/packages/hooks/use-toast'

type Squad = {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  isPublic: boolean
  _count: { members: number }
  owner: { name: string | null; image: string | null; urlId: string }
}

const STATUS_COLORS: Record<string, string> = {
  FORMING: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  ACTIVE: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  COMPLETED: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  DISBANDED: 'bg-destructive/20 text-destructive border-destructive/30',
}

export function NexiumDashboardClient() {
  const { toast } = useToast()
  const [squads, setSquads] = useState<Squad[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  const fetchSquads = useCallback(async () => {
    try {
      const res = await fetch('/api/discovery/squads?mine=true')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSquads(data.data?.squads ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load squads', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchSquads() }, [fetchSquads])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/discovery/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create squad')
      }
      toast({ title: 'Squad created' })
      setNewName('')
      setShowCreate(false)
      fetchSquads()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container space-y-6">
      {/* Header */}
      <div className="glass-card">
        <div className="p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discovery</h1>
            <p className="text-muted-foreground mt-1">
              Manage your squads, integrations, and team resources
            </p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Squad
          </Button>
        </div>
      </div>

      {/* Create form (inline) */}
      {showCreate && (
        <div className="glass-subtle p-6 space-y-4">
            <h2 className="text-lg font-semibold">Create a Squad</h2>
            <div className="flex gap-3">
              <Input
                placeholder="Squad name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="max-w-sm bg-muted/30 border-border/50"
              />
              <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? 'Creating…' : 'Create'}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
      )}

      {/* Squad list */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading squads…</div>
      ) : squads.length === 0 ? (
        <div className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">No squads yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create a squad to share uploads, domains, and resources with your team.
            </p>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first squad
            </Button>
          </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {squads.map((squad) => (
            <Link
              key={squad.id}
              href={`/dashboard/discovery/squads/${squad.id}`}
              className="glass-card glass-hover group"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {squad.name}
                    </h3>
                    {squad.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {squad.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className={STATUS_COLORS[squad.status] || ''}>
                    {squad.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {squad._count.members} member{squad._count.members !== 1 ? 's' : ''}
                  </span>
                  {!squad.isPublic && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Private
                    </span>
                  )}
                </div>

                {/* Quick stat icons */}
                <div className="flex items-center gap-4 pt-2 border-t border-border/40">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5" /> Storage
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" /> API Keys
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Domains
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
