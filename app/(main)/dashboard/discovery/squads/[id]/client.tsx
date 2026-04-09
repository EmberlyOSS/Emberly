'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Globe,
  HardDrive,
  Key,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Upload,
  UserMinus,
  UserPlus,
  Users,
  Eye,
  EyeOff,
  Search,
  Loader2,
} from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Separator } from '@/packages/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
import { useToast } from '@/packages/hooks/use-toast'

// ── Types ─────────────────────────────────────────────────────────────────────

type SquadMember = {
  id: string
  userId: string
  role: string
  joinedAt: string
  user: { id: string; name: string | null; image: string | null; urlId: string }
}

type Squad = {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  isPublic: boolean
  maxSize: number
  skills: string[]
  owner: { id: string; name: string | null; image: string | null; urlId: string }
  members: SquadMember[]
  _count: { members: number }
}

type SquadInvite = {
  id: string
  token: string
  status: string
  expiresAt: string
  createdAt: string
  user: { id: string; name: string | null; image: string | null; urlId: string; email: string | null }
  invitedBy: { id: string; name: string | null }
}

type UserSearchResult = {
  id: string
  name: string | null
  image: string | null
  urlId: string
  email: string | null
}

type ApiKeyInfo = {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  createdAt: string
}

type DomainInfo = {
  id: string
  domain: string
  verified: boolean
  cfStatus: string | null
  isPrimary: boolean
  createdAt: string
}

type QuotaInfo = {
  storageQuotaMB: number | null
  uploadSizeCapMB: number | null
  planName: string
  storageUsedMB: number
  percentUsed: number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-card transition-all duration-200 ${className}`}>{children}</div>
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  MEMBER: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  OBSERVER: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
}

const STATUS_COLORS: Record<string, string> = {
  FORMING: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  ACTIVE: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  COMPLETED: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  DISBANDED: 'bg-destructive/20 text-destructive border-destructive/30',
}

const TABS = [
  { value: 'overview', label: 'Overview', icon: Settings },
  { value: 'members', label: 'Members', icon: Users },
  { value: 'uploads', label: 'Uploads', icon: Upload },
  { value: 'keys', label: 'API Keys', icon: Key },
  { value: 'domains', label: 'Domains', icon: Globe },
  { value: 'storage', label: 'Storage', icon: HardDrive },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function SquadDashboardClient({
  squadId,
  role,
  embedded,
  activeTab,
  onTabChange,
}: {
  squadId: string
  role: string
  embedded?: boolean
  activeTab?: string
  onTabChange?: (tab: string) => void
}) {
  const { toast } = useToast()
  const isOwner = role === 'OWNER'

  const [squad, setSquad] = useState<Squad | null>(null)
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  const currentTab = embedded && activeTab !== undefined ? activeTab : tab
  const handleTabSwitch = embedded && onTabChange ? onTabChange : setTab

  // Data for each tab loaded lazily
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[] | null>(null)
  const [domains, setDomains] = useState<DomainInfo[] | null>(null)
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [uploadToken, setUploadToken] = useState<string | null>(null)
  const [tokenVisible, setTokenVisible] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Pending invites (owner only)
  const [invites, setInvites] = useState<SquadInvite[] | null>(null)
  const [revokingInvite, setRevokingInvite] = useState<string | null>(null)

  // ─── Fetch helpers ────────────────────────────────────────────────────

  const fetchSquad = useCallback(async () => {
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      // API returns apiResponse(squad) → data.data is the squad directly
      setSquad(data.data as Squad)
    } catch {
      toast({ title: 'Error', description: 'Failed to load squad', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [squadId, toast])

  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/keys`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setApiKeys(data.data?.keys ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load API keys', variant: 'destructive' })
    }
  }, [squadId, toast])

  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/domains`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDomains(data.data?.domains ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load domains', variant: 'destructive' })
    }
  }, [squadId, toast])

  const fetchInvites = useCallback(async () => {
    if (!isOwner) return
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/invites`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setInvites(data.data?.invites ?? [])
    } catch {
      setInvites([])
    }
  }, [squadId, isOwner])

  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/quota`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setQuota(data.data)
    } catch {
      toast({ title: 'Error', description: 'Failed to load quota', variant: 'destructive' })
    }
  }, [squadId, toast])

  const fetchToken = useCallback(async () => {
    if (!isOwner) return
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/token`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUploadToken(data.data?.uploadToken ?? null)
    } catch {
      // might not exist yet — fine
    }
  }, [squadId, isOwner])

  // ─── Initial load: squad + overview counts ───────────────────────────────

  useEffect(() => {
    fetchSquad()
    // Pre-fetch counts for overview stat cards
    fetchApiKeys()
    fetchDomains()
    if (isOwner) fetchInvites()
  }, [fetchSquad, fetchApiKeys, fetchDomains, fetchInvites, isOwner])

  useEffect(() => {
    if (currentTab === 'storage' && quota === null) fetchQuota()
    if (currentTab === 'uploads' && uploadToken === null) fetchToken()
  }, [currentTab, quota, uploadToken, fetchQuota, fetchToken])

  // ─── Actions ──────────────────────────────────────────────────────────

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
    toast({ title: 'Copied', description: `${label} copied to clipboard` })
  }, [toast])

  const rotateToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/token`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUploadToken(data.data?.uploadToken ?? null)
      toast({ title: 'Token rotated' })
    } catch {
      toast({ title: 'Error', description: 'Failed to rotate token', variant: 'destructive' })
    }
  }, [squadId, toast])

  const downloadShareX = useCallback(() => {
    window.open(`/api/discovery/squads/${squadId}/sharex`, '_blank')
  }, [squadId])

  // ─── API key management ───────────────────────────────────────────────

  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [creatingKey, setCreatingKey] = useState(false)

  const createKey = useCallback(async () => {
    if (!newKeyName.trim()) return
    setCreatingKey(true)
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed')
      }
      const data = await res.json()
      setCreatedKey(data.data?.key ?? null)
      setNewKeyName('')
      fetchApiKeys()
      toast({ title: 'API key created', description: 'Copy it now — you won\'t see it again.' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setCreatingKey(false)
    }
  }, [squadId, newKeyName, fetchApiKeys, toast])

  const revokeKey = useCallback(async (keyId: string) => {
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/keys/${keyId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setApiKeys((prev) => prev?.filter((k) => k.id !== keyId) ?? null)
      toast({ title: 'Key revoked' })
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke key', variant: 'destructive' })
    }
  }, [squadId, toast])

  // ─── Domain management ────────────────────────────────────────────────

  const [newDomain, setNewDomain] = useState('')
  const [addingDomain, setAddingDomain] = useState(false)

  const addDomain = useCallback(async () => {
    if (!newDomain.trim()) return
    setAddingDomain(true)
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim().toLowerCase() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed')
      }
      setNewDomain('')
      fetchDomains()
      toast({ title: 'Domain added', description: 'Add the CNAME record to verify it.' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setAddingDomain(false)
    }
  }, [squadId, newDomain, fetchDomains, toast])

  const removeDomain = useCallback(async (domainId: string) => {
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/domains/${domainId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setDomains((prev) => prev?.filter((d) => d.id !== domainId) ?? null)
      toast({ title: 'Domain removed' })
    } catch {
      toast({ title: 'Error', description: 'Failed to remove domain', variant: 'destructive' })
    }
  }, [squadId, toast])

  // ─── Member management ────────────────────────────────────────────────

  const [memberSearch, setMemberSearch] = useState('')
  const [memberSearchResults, setMemberSearchResults] = useState<UserSearchResult[]>([])
  const [memberSearchLoading, setMemberSearchLoading] = useState(false)
  const [addingMember, setAddingMember] = useState<string | null>(null)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchUsers = useCallback((query: string) => {
    setMemberSearch(query)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (!query.trim()) { setMemberSearchResults([]); return }
    searchDebounce.current = setTimeout(async () => {
      setMemberSearchLoading(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=8`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setMemberSearchResults(data.data?.users ?? [])
      } catch {
        setMemberSearchResults([])
      } finally {
        setMemberSearchLoading(false)
      }
    }, 300)
  }, [])

  const addMember = useCallback(async (userId: string) => {
    setAddingMember(userId)
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send invite')
      toast({ title: 'Invite sent', description: 'The user will receive an email to accept.' })
      setMemberSearch('')
      setMemberSearchResults([])
      fetchInvites()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setAddingMember(null)
    }
  }, [squadId, fetchInvites, toast])

  const revokeInvite = useCallback(async (inviteId: string) => {
    setRevokingInvite(inviteId)
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/invites/${inviteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to revoke invite')
      }
      setInvites((prev) => prev?.filter((i) => i.id !== inviteId) ?? null)
      toast({ title: 'Invite revoked' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setRevokingInvite(null)
    }
  }, [squadId, toast])

  const kickMember = useCallback(async (userId: string) => {
    try {
      // Must be POST with kick:true — DELETE is only for self-leave
      const res = await fetch(`/api/discovery/squads/${squadId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, kick: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to remove member')
      }
      fetchSquad()
      toast({ title: 'Member removed' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }, [squadId, fetchSquad, toast])

  const setMemberRole = useCallback(async (userId: string, newRole: string) => {
    setUpdatingRole(userId)
    try {
      const res = await fetch(`/api/discovery/squads/${squadId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update role')
      }
      fetchSquad()
      toast({ title: 'Role updated' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUpdatingRole(null)
    }
  }, [squadId, fetchSquad, toast])

  // ─── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={embedded ? '' : 'container'}>
        <div className="py-8 text-center text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (!squad) {
    return (
      <div className={embedded ? '' : 'container'}>
        <div className="py-8 text-center text-muted-foreground">Squad not found</div>
      </div>
    )
  }

  const tabsContent = (
    <Tabs value={currentTab} onValueChange={handleTabSwitch} className="space-y-6">
      {!embedded && (
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1 p-1.5 glass-subtle rounded-xl">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      )}

        {/* ─── Overview ──────────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-3">
            <GlassCard>
              <div className="p-6 text-center space-y-2">
                <Users className="h-8 w-8 mx-auto text-primary" />
                <p className="text-2xl font-bold">{squad._count.members}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="p-6 text-center space-y-2">
                <Globe className="h-8 w-8 mx-auto text-primary" />
                <p className="text-2xl font-bold">{domains?.length ?? '–'}</p>
                <p className="text-sm text-muted-foreground">Domains</p>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="p-6 text-center space-y-2">
                <Key className="h-8 w-8 mx-auto text-primary" />
                <p className="text-2xl font-bold">{apiKeys?.length ?? '–'}</p>
                <p className="text-sm text-muted-foreground">API Keys</p>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="mt-4">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Squad Info</h2>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Slug</span>
                  <p className="font-mono">{squad.slug}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Size</span>
                  <p>{squad.maxSize} members</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Visibility</span>
                  <p>{squad.isPublic ? 'Public' : 'Private'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Skills</span>
                  <div className="flex gap-1 flex-wrap mt-0.5">
                    {squad.skills.length > 0
                      ? squad.skills.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))
                      : <span className="text-muted-foreground italic">None set</span>}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* ─── Members ──────────────────────────────────────────── */}
        <TabsContent value="members">
          <GlassCard>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Members ({squad.members.length}/{squad.maxSize})
                </h2>
              </div>

              {/* Add member — owner only */}
              {isOwner && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search users to add…"
                      value={memberSearch}
                      onChange={(e) => searchUsers(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {memberSearchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {memberSearchResults.length > 0 && (
                    <div className="glass-subtle rounded-xl divide-y divide-border/30 overflow-hidden">
                      {memberSearchResults.map((u) => {
                        const alreadyMember = squad.members.some((m) => m.user.id === u.id)
                        return (
                          <div key={u.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              {u.image ? (
                                <img src={u.image} alt="" className="w-7 h-7 rounded-full" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                  {(u.name || '?')[0]}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">{u.name || u.urlId}</p>
                                {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                              </div>
                            </div>
                            {alreadyMember ? (
                              <Badge variant="outline" className="text-xs">Already a member</Badge>
                            ) : invites?.some((i) => i.user.id === u.id) ? (
                              <Badge variant="outline" className="text-xs bg-chart-4/20 text-chart-4 border-chart-4/30">Invited</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 h-7 text-xs"
                                disabled={addingMember === u.id}
                                onClick={() => addMember(u.id)}
                              >
                                {addingMember === u.id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <UserPlus className="h-3 w-3" />}
                                Invite
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Pending invites — owner only */}
              {isOwner && invites !== null && invites.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Pending Invites ({invites.length})</h3>
                  {invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between glass-subtle rounded-xl p-3 sm:p-4 border border-chart-4/20"
                    >
                      <div className="flex items-center gap-3">
                        {inv.user.image ? (
                          <img src={inv.user.image} alt="" className="w-8 h-8 rounded-full opacity-70" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center text-sm font-medium text-muted-foreground">
                            {(inv.user.name || '?')[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{inv.user.name || inv.user.urlId}</p>
                          <p className="text-xs text-muted-foreground">
                            Invited · expires {new Date(inv.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-chart-4/20 text-chart-4 border-chart-4/30">Pending</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => revokeInvite(inv.id)}
                          disabled={revokingInvite === inv.id}
                          title="Revoke invite"
                        >
                          {revokingInvite === inv.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <UserMinus className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Member list */}
              <div className="space-y-2">
                {squad.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between glass-subtle rounded-xl p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-3">
                      {m.user.image ? (
                        <img src={m.user.image} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                          {(m.user.name || '?')[0]}
                        </div>
                      )}
                      <div>
                        <Link href={`/${m.user.urlId}`} className="font-medium hover:text-primary transition-colors text-sm">
                          {m.user.name || m.user.urlId}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Joined {new Date(m.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Role badge / selector */}
                      {isOwner && m.role !== 'OWNER' ? (
                        <select
                          value={m.role}
                          disabled={updatingRole === m.userId}
                          onChange={(e) => setMemberRole(m.userId, e.target.value)}
                          className="text-xs rounded-lg px-2 py-1 bg-muted/40 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="OBSERVER">Observer</option>
                        </select>
                      ) : (
                        <Badge variant="outline" className={`text-xs ${ROLE_COLORS[m.role] || ''}`}>
                          {m.role}
                        </Badge>
                      )}

                      {/* Kick button */}
                      {isOwner && m.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => kickMember(m.user.id)}
                          title="Remove from squad"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* ─── Uploads (token + ShareX config) ──────────────────── */}
        <TabsContent value="uploads">
          <GlassCard>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Upload Token</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Use this token in ShareX or other tools to upload files to the squad.
                </p>
              </div>

              {isOwner ? (
                <div className="space-y-4">
                  {uploadToken ? (
                    <div className="glass-subtle rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono bg-black/20 rounded-lg px-3 py-2 break-all">
                          {tokenVisible ? uploadToken : '•'.repeat(36)}
                        </code>
                        <Button size="sm" variant="ghost" onClick={() => setTokenVisible(!tokenVisible)}>
                          {tokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(uploadToken, 'Token')}>
                          {copied === 'Token' ? <Check className="h-4 w-4 text-chart-2" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-2" onClick={rotateToken}>
                          <RefreshCw className="h-3.5 w-3.5" /> Rotate Token
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={rotateToken} className="gap-2">
                      <Key className="h-4 w-4" /> Generate Upload Token
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Only the squad owner can manage the upload token.</p>
              )}

              <Separator className="border-border/40" />

              <div>
                <h2 className="text-lg font-semibold">ShareX Config</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Download a pre-configured ShareX config that uploads to this squad.
                </p>
                <Button
                  variant="outline"
                  className="gap-2 mt-3"
                  onClick={downloadShareX}
                  disabled={!uploadToken}
                >
                  <Download className="h-4 w-4" /> Download .sxcu
                </Button>
                {!uploadToken && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Generate an upload token first to enable ShareX config download.
                  </p>
                )}
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* ─── API Keys ─────────────────────────────────────────── */}
        <TabsContent value="keys">
          <GlassCard>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">API Keys</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Named keys for CI/CD, bots, and integrations. Keys start with <code className="text-xs bg-black/20 px-1.5 py-0.5 rounded">nsk_</code>.
                </p>
              </div>

              {/* Created key flash alert */}
              {createdKey && (
                <div className="glass-subtle rounded-xl p-4 border border-chart-2/30 space-y-2">
                  <p className="text-sm font-medium text-chart-2">New key created — copy it now!</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-black/20 rounded-lg px-3 py-2 break-all">
                      {createdKey}
                    </code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createdKey, 'API key')}>
                      {copied === 'API key' ? <Check className="h-4 w-4 text-chart-2" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setCreatedKey(null)}>
                    Dismiss
                  </Button>
                </div>
              )}

              {/* Create new key */}
              {isOwner && (
                <div className="flex gap-3">
                  <Input
                    placeholder="Key name, e.g. CI/CD Pipeline"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createKey()}
                    className="max-w-sm bg-muted/30 border-border/50"
                  />
                  <Button onClick={createKey} disabled={creatingKey || !newKeyName.trim()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {creatingKey ? 'Creating…' : 'Create Key'}
                  </Button>
                </div>
              )}

              {/* Key list */}
              {apiKeys === null ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No API keys yet.</p>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between glass-subtle rounded-xl p-4">
                      <div className="space-y-0.5">
                        <p className="font-medium">{k.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{k.prefix}…</p>
                        {k.lastUsedAt && (
                          <p className="text-xs text-muted-foreground">
                            Last used {new Date(k.lastUsedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => revokeKey(k.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>

        {/* ─── Domains ──────────────────────────────────────────── */}
        <TabsContent value="domains">
          <GlassCard>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Custom Domains</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your own domain for the squad's file uploads and profile.
                </p>
              </div>

              {isOwner && (
                <div className="flex gap-3">
                  <Input
                    placeholder="files.yourteam.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                    className="max-w-sm bg-muted/30 border-border/50"
                  />
                  <Button onClick={addDomain} disabled={addingDomain || !newDomain.trim()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {addingDomain ? 'Adding…' : 'Add Domain'}
                  </Button>
                </div>
              )}

              {domains === null ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : domains.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No custom domains yet.</p>
              ) : (
                <div className="space-y-3">
                  {domains.map((d) => (
                    <div key={d.id} className="flex items-center justify-between glass-subtle rounded-xl p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium font-mono">{d.domain}</p>
                          {d.isPrimary && <Badge variant="outline" className="text-xs">Primary</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {d.verified ? (
                            <Badge variant="outline" className="bg-chart-2/20 text-chart-2 border-chart-2/30">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-chart-4/20 text-chart-4 border-chart-4/30">
                              {d.cfStatus || 'Pending'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeDomain(d.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>

        {/* ─── Storage / Quota ──────────────────────────────────── */}
        <TabsContent value="storage">
          <GlassCard>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Storage &amp; Plan</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Current storage usage and plan limits for this squad.
                </p>
              </div>

              {quota === null ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <div className="space-y-6">
                  <div className="glass-subtle rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <Badge variant="outline">{quota.planName}</Badge>
                    </div>
                    <Separator className="border-border/40" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Storage Used</span>
                        <span className="font-mono">
                          {quota.storageUsedMB.toFixed(1)} MB
                          {quota.storageQuotaMB !== null && (
                            <span className="text-muted-foreground"> / {quota.storageQuotaMB >= 1024
                              ? `${(quota.storageQuotaMB / 1024).toFixed(1)} GB`
                              : `${quota.storageQuotaMB} MB`
                            }</span>
                          )}
                        </span>
                      </div>
                      {quota.percentUsed !== null && (
                        <div className="w-full bg-muted/40 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              quota.percentUsed > 90
                                ? 'bg-destructive'
                                : quota.percentUsed > 70
                                  ? 'bg-chart-4'
                                  : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(quota.percentUsed, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {quota.uploadSizeCapMB !== null && (
                      <>
                        <Separator className="border-border/40" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Max Upload Size</span>
                          <span className="font-mono">{quota.uploadSizeCapMB} MB</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
  )

  if (embedded) return tabsContent

  return (
    <div className="container space-y-6">
      {/* Header */}
      <div className="glass-card">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/dashboard/discovery"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{squad.name}</h1>
                <Badge variant="outline" className={STATUS_COLORS[squad.status] || ''}>
                  {squad.status}
                </Badge>
              </div>
              {squad.description && (
                <p className="text-muted-foreground mt-1">{squad.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {tabsContent}
    </div>
  )
}
