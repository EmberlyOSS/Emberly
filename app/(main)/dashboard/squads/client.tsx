'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Check,
  ChevronRight,
  Globe,
  HardDrive,
  Key,
  Plus,
  Shield,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { useToast } from '@/packages/hooks/use-toast'

// -- Types -------------------------------------------------------------------

type SquadIncomingInvite = {
  id: string
  token: string
  expiresAt: string
  createdAt: string
  squad: {
    id: string
    name: string
    slug: string
    description: string | null
    logo: string | null
    _count: { members: number }
    maxSize: number
  }
  invitedBy: { id: string; name: string | null; image: string | null; urlId: string }
}

type Squad = {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  isPublic: boolean
  myRole: string
  _count: { members: number }
  owner: { name: string | null; image: string | null; urlId: string }
}

// -- Constants ---------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  FORMING: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  ACTIVE: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  COMPLETED: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  DISBANDED: 'bg-destructive/20 text-destructive border-destructive/30',
}

// -- Glass card wrappers -----------------------------------------------------

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-card transition-all duration-300 ${className}`}>{children}</div>
}

function GlassCardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
}

function GlassCardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`font-semibold leading-none tracking-tight text-lg ${className}`}>{children}</h3>
}

function GlassCardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

// -- Incoming invites section -----------------------------------------------

function IncomingInvites() {
  const { toast } = useToast()
  const [invites, setInvites] = useState<SquadIncomingInvite[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/discovery/invites')
      .then((r) => r.json())
      .then((d) => setInvites(d.data?.invites ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const handleAccept = useCallback((inv: SquadIncomingInvite) => {
    window.location.href = `/api/discovery/invites/${inv.token}/accept`
  }, [])

  const handleDecline = useCallback((inv: SquadIncomingInvite) => {
    window.location.href = `/api/discovery/invites/${inv.token}/decline`
  }, [])

  if (!loaded || invites.length === 0) return null

  return (
    <GlassCard>
      <GlassCardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <GlassCardTitle>Squad Invites</GlassCardTitle>
          <span className="text-xs font-medium bg-primary/15 text-primary border border-primary/25 rounded-full px-2 py-0.5">
            {invites.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">You&apos;ve been invited to join these squads</p>
      </GlassCardHeader>
      <GlassCardContent className="space-y-3">
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3 border border-primary/15"
          >
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-semibold truncate">{inv.squad.name}</p>
              <p className="text-xs text-muted-foreground">
                Invited by {inv.invitedBy.name ?? inv.invitedBy.urlId}
                {' · '}
                {inv.squad._count.members}/{inv.squad.maxSize} members
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => handleDecline(inv)}
              >
                <X className="h-3.5 w-3.5" />
                Decline
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => handleAccept(inv)}
              >
                <Check className="h-3.5 w-3.5" />
                Accept
              </Button>
            </div>
          </div>
        ))}
      </GlassCardContent>
    </GlassCard>
  )
}

// -- Squads list section -----------------------------------------------------

function SquadsList() {
  const router = useRouter()
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

  useEffect(() => {
    fetchSquads()
  }, [fetchSquads])

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
        throw new Error((err as { error?: string }).error || 'Failed to create squad')
      }
      toast({ title: 'Squad created' })
      setNewName('')
      setShowCreate(false)
      fetchSquads()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create squad',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Your Squads</GlassCardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Create and manage teams with shared uploads, domains, and resources
        </p>
      </GlassCardHeader>
      <GlassCardContent className="space-y-6">
        {/* Early access banner */}
        <div className="relative rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">Early Access</p>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/10 h-5">
                    Nexium
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organized hubs for your team&apos;s output — share uploads, domains, and resources with your squad.
                  Available now for all users with public profiles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Header + create */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {squads.length} squad{squads.length !== 1 ? 's' : ''}
          </p>
          <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Squad
          </Button>
        </div>

        {showCreate && (
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <p className="text-sm font-medium">Create a squad</p>
            <div className="flex gap-2">
              <Input
                placeholder="Squad name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Squad list */}
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading squads...</div>
        ) : squads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">No squads yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Create a squad to share uploads, domains, and resources with your team.
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Create your first squad
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {squads.map((squad) => (
              <button
                key={squad.id}
                onClick={() => router.push(`/dashboard/squads/${squad.id}`)}
                className="group rounded-xl border border-border/50 bg-card p-4 space-y-3 hover:border-border hover:shadow-md hover:shadow-black/5 transition-all duration-200 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
                      {squad.name}
                    </p>
                    {squad.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{squad.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] h-5 ${STATUS_COLORS[squad.status] ?? ''}`}>
                    {squad.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {squad._count.members} member{squad._count.members !== 1 ? 's' : ''}
                  </span>
                  {!squad.isPublic && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Private
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                  {[
                    { icon: HardDrive, label: 'Storage' },
                    { icon: Key, label: 'API Keys' },
                    { icon: Globe, label: 'Domains' },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Icon className="h-3 w-3" /> {label}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  )
}

// -- Main exported client ----------------------------------------------------

export function SquadsClient() {
  return (
    <div className="space-y-6">
      <IncomingInvites />
      <SquadsList />
    </div>
  )
}
