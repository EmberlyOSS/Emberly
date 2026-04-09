'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Users,
  Plus,
  ChevronRight,
  Shield,
  Globe,
  Key,
  HardDrive,
  User,
  Sparkles,
  Layers,
  FolderOpen,
  ArrowLeft,
  Settings,
  Upload,
  Zap,
  Briefcase,
  ClipboardList,
  Bell,
  Check,
  X,
} from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import { Input } from '@/packages/components/ui/input'
import { ScrollIndicator } from '@/packages/components/ui/scroll-indicator'
import { useToast } from '@/packages/hooks/use-toast'
import { NexiumDashboard, type NexiumSection } from '@/packages/components/profile/nexium-dashboard'
import { SquadDashboardClient } from './squads/[id]/client'

// -- Types -------------------------------------------------------------------

type SquadIncomingInvite = {
  id: string
  token: string
  expiresAt: string
  createdAt: string
  squad: {
    id: string
    name: string
    urlId: string
    description: string | null
    avatarUrl: string | null
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

// Top-level sidebar items
const topLevelSections = [
  { value: 'talent', label: 'Talent Profile', icon: User },
  { value: 'squads', label: 'Squads', icon: Users },
]

// Talent profile sub-sections — replaces the internal ScrollIndicator in desktop sidebar
const talentSubSections: { value: NexiumSection; label: string; icon: React.ElementType }[] = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'skills', label: 'Skills', icon: Sparkles },
  { value: 'signals', label: 'Signals', icon: Zap },
  { value: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { value: 'applications', label: 'Applications', icon: ClipboardList },
]

// Squad sub-sections
const squadTabs = [
  { value: 'overview', label: 'Overview', icon: Settings },
  { value: 'members', label: 'Members', icon: Users },
  { value: 'uploads', label: 'Uploads', icon: Upload },
  { value: 'keys', label: 'API Keys', icon: Key },
  { value: 'domains', label: 'Domains', icon: Globe },
  { value: 'storage', label: 'Storage', icon: HardDrive },
]

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
    // Navigate to the token accept URL — it validates, creates the membership, and redirects back
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
        <p className="text-sm text-muted-foreground mt-1">You've been invited to join these squads</p>
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

function SquadsList({ onSquadSelect }: { onSquadSelect: (squad: Squad) => void }) {
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
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Squads</GlassCardTitle>
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
          <div className="relative p-5 space-y-4">
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
                    Manage your talent profile, squads, signals, and team resources in one place. Organized hubs for your team's output share uploads, domains, and resources with your squad. Stay informed with built-in oversight tools so nothing slips through the cracks. Available now for all users with public profiles, with private squads and advanced features launching soon.
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
                onClick={() => onSquadSelect(squad)}
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

// -- Sidebar button helpers --------------------------------------------------

function SidebarBtn({
  isActive,
  onClick,
  icon: Icon,
  label,
  indent = false,
}: {
  isActive: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  indent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
        indent ? 'pl-4' : ''
      } ${
        isActive
          ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  )
}

// -- Main exported client ----------------------------------------------------

export function NexiumDashboardClient() {
  const searchParams = useSearchParams()
  const [selectedTab, setSelectedTab] = useState<'talent' | 'squads'>('talent')
  const [talentSection, setTalentSection] = useState<NexiumSection>('profile')
  const [selectedSquad, setSelectedSquad] = useState<{ id: string; role: string; name: string } | null>(null)
  const [squadTab, setSquadTab] = useState('overview')

  // Set initial tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'squads') setSelectedTab('squads')
  }, [searchParams])

  // Update URL when top-level tab changes
  const handleTabChange = useCallback((value: 'talent' | 'squads') => {
    setSelectedTab(value)
    setSelectedSquad(null)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    window.history.pushState({}, '', url.toString())
  }, [])

  const handleSquadSelect = useCallback((squad: Squad) => {
    setSelectedSquad({ id: squad.id, role: squad.myRole, name: squad.name })
    setSquadTab('overview')
  }, [])

  const handleBackToSquads = useCallback(() => {
    setSelectedSquad(null)
    setSquadTab('overview')
  }, [])

  // Determine which sidebar mode we're in
  const mode = selectedSquad
    ? 'squad'
    : selectedTab === 'talent'
      ? 'talent'
      : 'top'

  // Mobile strip items
  const mobileItems = (() => {
    if (mode === 'squad') return squadTabs
    if (mode === 'talent') return talentSubSections
    return topLevelSections
  })()

  return (
    <div className="flex flex-col lg:flex-row gap-6 overflow-hidden lg:items-start">
      {/* Sidebar Navigation */}
      <nav className="lg:w-56 shrink-0">

        {/* Mobile: horizontal scrollable strip */}
        <ScrollIndicator className="lg:hidden glass-subtle rounded-xl p-1.5">
          <div className="flex gap-1 w-max">
            {(mode === 'squad' || mode === 'talent') && (
              <button
                onClick={mode === 'squad' ? handleBackToSquads : () => handleTabChange('squads')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-150"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                {mode === 'squad' ? 'Squads' : 'Back'}
              </button>
            )}
            {mobileItems.map((item) => {
              const Icon = item.icon
              const isActive =
                mode === 'squad'
                  ? squadTab === item.value
                  : mode === 'talent'
                    ? talentSection === item.value
                    : selectedTab === item.value
              const handleClick = () => {
                if (mode === 'squad') setSquadTab(item.value)
                else if (mode === 'talent') setTalentSection(item.value as NexiumSection)
                else handleTabChange(item.value as 'talent' | 'squads')
              }
              return (
                <button
                  key={item.value}
                  onClick={handleClick}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {isActive && item.label}
                </button>
              )
            })}
          </div>
        </ScrollIndicator>

        {/* Desktop: full grouped sidebar */}
        <div className="hidden lg:block glass-subtle rounded-xl p-2 lg:sticky lg:top-24 space-y-3">

          {/* ── Squad detail mode ── */}
          {mode === 'squad' && (
            <>
              <SidebarBtn
                isActive={false}
                onClick={handleBackToSquads}
                icon={ArrowLeft}
                label="Back to Squads"
              />
              <div className="px-3 py-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {selectedSquad!.name}
                </p>
              </div>
              <div className="space-y-0.5">
                {squadTabs.map((item) => (
                  <SidebarBtn
                    key={item.value}
                    isActive={squadTab === item.value}
                    onClick={() => setSquadTab(item.value)}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Talent profile mode ── */}
          {mode === 'talent' && (
            <>
              <div className="space-y-0.5">
                {/* Top-level items — Talent Profile stays active, Squads navigates away */}
                {topLevelSections.map((item) => {
                  const Icon = item.icon
                  const isActive = item.value === 'talent'
                  return (
                    <button
                      key={item.value}
                      onClick={() => handleTabChange(item.value as 'talent' | 'squads')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  )
                })}
              </div>

              {/* Talent sub-sections indented below */}
              <div className="space-y-0.5 pl-2 border-l border-border/40 ml-3">
                {talentSubSections.map((item) => (
                  <SidebarBtn
                    key={item.value}
                    isActive={talentSection === item.value}
                    onClick={() => setTalentSection(item.value)}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Top-level mode (squads list) ── */}
          {mode === 'top' && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Discovery
              </p>
              {topLevelSections.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.value}
                    onClick={() => handleTabChange(item.value as 'talent' | 'squads')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                      selectedTab === item.value
                        ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
        {mode === 'squad' && (
          <SquadDashboardClient
            squadId={selectedSquad!.id}
            role={selectedSquad!.role}
            embedded
            activeTab={squadTab}
            onTabChange={setSquadTab}
          />
        )}

        {mode === 'talent' && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Talent Profile</GlassCardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Set up your talent profile to get discovered for opportunities, collaborations, and squads
              </p>
            </GlassCardHeader>
            <GlassCardContent>
              <NexiumDashboard
                activeSection={talentSection}
                onSectionChange={setTalentSection}
              />
            </GlassCardContent>
          </GlassCard>
        )}

        {mode === 'top' && (
          <>
            <IncomingInvites />
            <SquadsList onSquadSelect={handleSquadSelect} />
          </>
        )}
      </div>
    </div>
  )
}
