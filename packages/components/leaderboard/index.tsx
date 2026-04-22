'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/packages/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/packages/components/ui/tabs'
import {
  Trophy,
  FileText,
  Medal,
  Crown,
  TrendingUp,
  Users,
  Compass,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react'

interface ContributorUser {
  id: string
  name: string | null
  image: string | null
  urlId: string
  role: string | null
  alphaUser: boolean
  fileCount: number
  rank: number
}

interface DiscoveryUser {
  id: string
  name: string | null
  image: string | null
  urlId: string
  role: string | null
  alphaUser: boolean
  title: string | null
  availability: string
  skillCount: number
  signalCount: number
  rank: number
}

interface Squad {
  id: string
  name: string
  description: string | null
  slug: string
  memberCount: number
  rank: number
}

type Category = 'contributors' | 'discovery' | 'squads'

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-amber-500/25 ring-2 ring-amber-200/50">
        <Crown className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg shadow-slate-500/25 ring-2 ring-slate-200/50">
        <Medal className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg shadow-amber-700/25 ring-2 ring-amber-500/50">
        <Medal className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted/50 font-bold text-muted-foreground border border-border">
      {rank}
    </div>
  )
}

function PodiumCard({
  user,
  rank,
  stat,
  statLabel,
}: {
  user: { name: string | null; image: string | null }
  rank: number
  stat: string
  statLabel: string
}) {
  const isFirst = rank === 1
  const colors = {
    1: { ring: 'border-amber-200/20', glow: 'from-yellow-300 to-amber-500', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    2: { ring: 'border-slate-200/20', glow: 'from-slate-300 to-slate-500', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
    3: { ring: 'border-amber-700/20', glow: 'from-amber-700 to-amber-900', badge: 'bg-amber-800/10 text-amber-700 dark:text-amber-500' },
  }[rank] ?? { ring: '', glow: '', badge: '' }

  return (
    <div className={`glass-card h-full transform hover:-translate-y-2 transition-all duration-300 relative overflow-visible ${isFirst ? 'gradient-border-animated z-20' : 'glass-hover z-10'}`}>
      {isFirst && <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none rounded-2xl" />}
      <div className={`absolute ${isFirst ? '-top-8' : '-top-6'} left-1/2 -translate-x-1/2 z-20`}>
        <RankBadge rank={rank} />
      </div>
      <div className={`${isFirst ? 'p-8 pt-12' : 'p-6 pt-10'} text-center flex flex-col items-center h-full`}>
        <div className={`relative ${isFirst ? 'w-24 h-24' : 'w-20 h-20'} mb-4 overflow-hidden rounded-full`}>
          {isFirst && <div className="absolute -inset-1 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full blur-sm opacity-50 animate-pulse" />}
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              fill
              className={`rounded-full object-cover border-4 ${colors.ring} ${isFirst ? 'z-10' : ''}`}
            />
          ) : (
            <div className={`${isFirst ? 'relative z-10' : ''} w-full h-full rounded-full bg-gradient-to-br ${colors.glow} flex items-center justify-center text-white ${isFirst ? 'text-3xl' : 'text-2xl'} font-bold`}>
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
        <h3 className={`${isFirst ? 'text-2xl' : 'text-xl'} font-bold mb-1 truncate w-full`}>
          {user.name || 'Anonymous'}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">@{user.name}</p>
        <div className={`mt-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.badge} font-medium text-sm`}>
          {stat} {statLabel}
        </div>
      </div>
    </div>
  )
}

function ContributorRow({ user }: { user: ContributorUser }) {
  return (
    <Link href={`/user/${user.name}`} className="block group">
      <div className="flex items-center gap-4 p-4 rounded-xl glass-subtle glass-hover transition-all">
        <div className="flex-shrink-0 w-12 text-center">
          <RankBadge rank={user.rank} />
        </div>
        <div className="flex-shrink-0">
          {user.image ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <Image src={user.image} alt={user.name || 'User'} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 text-primary font-bold text-lg">
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {user.name || 'Anonymous User'}
            </h3>
            {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/10 border-primary/20 text-primary">Admin</Badge>
            )}
            {user.alphaUser && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-amber-500/10 border-amber-500/20 text-amber-500">Alpha</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">@{user.name}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-2 justify-end text-foreground font-medium">
            <span>{user.fileCount.toLocaleString()}</span>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">files</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </Link>
  )
}

function DiscoveryRow({ user }: { user: DiscoveryUser }) {
  const availColor: Record<string, string> = {
    OPEN: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    LIMITED: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    CLOSED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  }

  return (
    <Link href={`/user/${user.name}`} className="block group">
      <div className="flex items-center gap-4 p-4 rounded-xl glass-subtle glass-hover transition-all">
        <div className="flex-shrink-0 w-12 text-center">
          <RankBadge rank={user.rank} />
        </div>
        <div className="flex-shrink-0">
          {user.image ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <Image src={user.image} alt={user.name || 'User'} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 text-primary font-bold text-lg">
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {user.name || 'Anonymous User'}
            </h3>
            <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${availColor[user.availability] ?? ''}`}>
              {user.availability}
            </Badge>
          </div>
          {user.title && <p className="text-sm text-muted-foreground truncate">{user.title}</p>}
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-3">
          <div className="text-center">
            <span className="font-medium text-foreground">{user.skillCount}</span>
            <p className="text-xs text-muted-foreground">skills</p>
          </div>
          <div className="text-center">
            <span className="font-medium text-foreground">{user.signalCount}</span>
            <p className="text-xs text-muted-foreground">signals</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </Link>
  )
}

function SquadRow({ squad }: { squad: Squad }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl glass-subtle glass-hover transition-all">
      <div className="flex-shrink-0 w-12 text-center">
        <RankBadge rank={squad.rank} />
      </div>
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 text-primary font-bold text-lg">
          {squad.name.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{squad.name}</h3>
        {squad.description && (
          <p className="text-sm text-muted-foreground truncate">{squad.description}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-2 justify-end text-foreground font-medium">
          <span>{squad.memberCount}</span>
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">members</p>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <p>{message}</p>
    </div>
  )
}

export function Leaderboard() {
  const [category, setCategory] = useState<Category>('contributors')
  const [contributors, setContributors] = useState<ContributorUser[]>([])
  const [discoveryUsers, setDiscoveryUsers] = useState<DiscoveryUser[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategory = useCallback(async (cat: Category) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?category=${cat}`)
      const data = await res.json()
      if (!Array.isArray(data)) return
      if (cat === 'contributors') setContributors(data)
      else if (cat === 'discovery') setDiscoveryUsers(data)
      else if (cat === 'squads') setSquads(data)
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategory('contributors')
  }, [fetchCategory])

  const handleTabChange = (value: string) => {
    const cat = value as Category
    setCategory(cat)
    const cached = cat === 'contributors' ? contributors : cat === 'discovery' ? discoveryUsers : squads
    if (cached.length === 0) {
      fetchCategory(cat)
    } else {
      setLoading(false)
    }
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl glass-subtle animate-pulse">
          <div className="w-10 h-10 rounded-full bg-muted/50" />
          <div className="w-12 h-12 rounded-full bg-muted/50" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted/50 rounded" />
            <div className="h-3 w-24 bg-muted/30 rounded" />
          </div>
          <div className="h-4 w-16 bg-muted/50 rounded" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="text-center mb-12 space-y-4 animate-fade-up">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4 animate-float">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Community Leaderboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Recognizing the most active contributors, discovery profiles, and squads in the community.
        </p>
      </div>

      <Tabs defaultValue="contributors" onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-12 h-auto p-1.5 gap-1 rounded-xl bg-muted/50">
          <TabsTrigger
            value="contributors"
            className="gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Contributors</span>
            <span className="sm:hidden">Top</span>
          </TabsTrigger>
          <TabsTrigger
            value="discovery"
            className="gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Discovery</span>
            <span className="sm:hidden">Talent</span>
          </TabsTrigger>
          <TabsTrigger
            value="squads"
            className="gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
          >
            <Users className="w-4 h-4" />
            Squads
          </TabsTrigger>
        </TabsList>

        {/* Contributors Tab */}
        <TabsContent value="contributors" className="space-y-8">
          {!loading && contributors.length >= 3 && (
            <div className="hidden md:grid grid-cols-3 gap-6 items-end animate-fade-up">
              <Link href={`/user/${contributors[1].name}`} className="group h-full">
                <PodiumCard user={contributors[1]} rank={2} stat={contributors[1].fileCount.toLocaleString()} statLabel="Files" />
              </Link>
              <Link href={`/user/${contributors[0].name}`} className="group h-full -mt-12">
                <PodiumCard user={contributors[0]} rank={1} stat={contributors[0].fileCount.toLocaleString()} statLabel="Files" />
              </Link>
              <Link href={`/user/${contributors[2].name}`} className="group h-full">
                <PodiumCard user={contributors[2]} rank={3} stat={contributors[2].fileCount.toLocaleString()} statLabel="Files" />
              </Link>
            </div>
          )}

          <div className="glass-card p-6 animate-fade-up">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top Contributors
            </h2>
            {loading ? <LoadingSkeleton /> : contributors.length === 0 ? (
              <EmptyState message="No contributors yet." />
            ) : (
              <div className="space-y-3">
                {contributors.map((user) => (
                  <ContributorRow key={user.id} user={user} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Discovery Tab */}
        <TabsContent value="discovery" className="space-y-8">
          {!loading && discoveryUsers.length >= 3 && (
            <div className="hidden md:grid grid-cols-3 gap-6 items-end animate-fade-up">
              <Link href={`/user/${discoveryUsers[1].name}`} className="group h-full">
                <PodiumCard user={discoveryUsers[1]} rank={2} stat={`${discoveryUsers[1].skillCount} skills`} statLabel="" />
              </Link>
              <Link href={`/user/${discoveryUsers[0].name}`} className="group h-full -mt-12">
                <PodiumCard user={discoveryUsers[0]} rank={1} stat={`${discoveryUsers[0].skillCount} skills`} statLabel="" />
              </Link>
              <Link href={`/user/${discoveryUsers[2].name}`} className="group h-full">
                <PodiumCard user={discoveryUsers[2]} rank={3} stat={`${discoveryUsers[2].skillCount} skills`} statLabel="" />
              </Link>
            </div>
          )}

          <div className="glass-card p-6 animate-fade-up">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Top Discovery Profiles
            </h2>
            {loading ? <LoadingSkeleton /> : discoveryUsers.length === 0 ? (
              <EmptyState message="No discovery profiles yet. Be the first to create one!" />
            ) : (
              <div className="space-y-3">
                {discoveryUsers.map((user) => (
                  <DiscoveryRow key={user.id} user={user} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Squads Tab */}
        <TabsContent value="squads" className="space-y-8">
          <div className="glass-card p-6 animate-fade-up">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Top Squads
            </h2>
            {loading ? <LoadingSkeleton /> : squads.length === 0 ? (
              <EmptyState message="No active squads yet. Create one to get started!" />
            ) : (
              <div className="space-y-3">
                {squads.map((squad) => (
                  <SquadRow key={squad.id} squad={squad} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
