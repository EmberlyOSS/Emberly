'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/packages/components/ui/badge'
import {
  Trophy,
  FileText,
  Medal,
  Crown,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

// Types based on the API response
interface LeaderboardUser {
  id: string
  name: string | null
  image: string | null
  urlId: string
  role: string | null
  alphaUser: boolean
  fileCount: number
  rank: number
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-amber-500/25 ring-2 ring-amber-200/50">
        <Crown className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg shadow-slate-500/25 ring-2 ring-slate-200/50">
        <Medal className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg shadow-amber-700/25 ring-2 ring-amber-500/50">
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

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLeaderboard(data)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-12 bg-muted rounded-full mx-auto"></div>
          <div className="h-8 w-64 bg-muted rounded mx-auto"></div>
          <div className="h-4 w-48 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4 animate-in fade-in zoom-in duration-500">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent animate-in fade-in slide-in-from-bottom-4 duration-700">
          Community Leaderboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          Recognizing the top {leaderboard.length} most active contributors and power users sharing content with the world.
        </p>
      </div>

      {/* Top 3 Podium Cards (Desktop) */}
      {leaderboard.length >= 3 && (
        <div className="hidden md:grid grid-cols-3 gap-6 items-end mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          {/* 2nd Place */}
          <Link href={`/user/${leaderboard[1].urlId}`} className="group h-full">
            <GlassCard className="h-full transform group-hover:-translate-y-2 transition-transform duration-300 relative overflow-visible z-10">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                <RankBadge rank={2} />
              </div>
              <div className="p-6 pt-10 text-center flex flex-col items-center h-full">
                <div className="relative w-20 h-20 mb-4">
                  {leaderboard[1].image ? (
                    <Image
                      src={leaderboard[1].image}
                      alt={leaderboard[1].name || 'User'}
                      fill
                      className="rounded-full object-cover border-4 border-slate-200/20"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-2xl font-bold">
                      {leaderboard[1].name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1 truncate w-full group-hover:text-primary transition-colors">
                  {leaderboard[1].name || 'Anonymous'}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm text-muted-foreground">@{leaderboard[1].urlId}</p>
                </div>
                <div className="mt-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 font-medium text-sm">
                  <FileText className="w-4 h-4" />
                  {leaderboard[1].fileCount.toLocaleString()} Files
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* 1st Place */}
          <Link href={`/user/${leaderboard[0].urlId}`} className="group h-full -mt-12">
            <GlassCard className="h-full transform group-hover:-translate-y-2 transition-transform duration-300 relative overflow-visible z-20 border-primary/50 shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
                <RankBadge rank={1} />
              </div>
              <div className="p-8 pt-12 text-center flex flex-col items-center h-full">
                <div className="relative w-24 h-24 mb-4">
                  <div className="absolute -inset-1 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full blur-sm opacity-50 animate-pulse" />
                  {leaderboard[0].image ? (
                    <Image
                      src={leaderboard[0].image}
                      alt={leaderboard[0].name || 'User'}
                      fill
                      className="rounded-full object-cover border-4 border-amber-200/20 relative z-10"
                    />
                  ) : (
                    <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white text-3xl font-bold">
                      {leaderboard[0].name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-1 truncate w-full group-hover:text-primary transition-colors">
                  {leaderboard[0].name || 'Anonymous'}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-sm text-muted-foreground">@{leaderboard[0].urlId}</p>
                </div>
                <div className="mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                  <FileText className="w-5 h-5" />
                  {leaderboard[0].fileCount.toLocaleString()} Files
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* 3rd Place */}
          <Link href={`/user/${leaderboard[2].urlId}`} className="group h-full">
            <GlassCard className="h-full transform group-hover:-translate-y-2 transition-transform duration-300 relative overflow-visible z-10">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                <RankBadge rank={3} />
              </div>
              <div className="p-6 pt-10 text-center flex flex-col items-center h-full">
                <div className="relative w-20 h-20 mb-4">
                  {leaderboard[2].image ? (
                    <Image
                      src={leaderboard[2].image}
                      alt={leaderboard[2].name || 'User'}
                      fill
                      className="rounded-full object-cover border-4 border-amber-700/20"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-white text-2xl font-bold">
                      {leaderboard[2].name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1 truncate w-full group-hover:text-primary transition-colors">
                  {leaderboard[2].name || 'Anonymous'}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm text-muted-foreground">@{leaderboard[2].urlId}</p>
                </div>
                <div className="mt-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-800/10 text-amber-700 dark:text-amber-500 font-medium text-sm">
                  <FileText className="w-4 h-4" />
                  {leaderboard[2].fileCount.toLocaleString()} Files
                </div>
              </div>
            </GlassCard>
          </Link>
        </div>
      )}

      {/* Full List */}
      <GlassCard className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Top Contributors
          </h2>
          
          <div className="space-y-4">
            {leaderboard.map((user, index) => {
              return (
                <Link 
                  key={user.id} 
                  href={`/user/${user.urlId}`}
                  className="block group"
                >
                  <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                    <div className="flex-shrink-0 w-12 text-center">
                      <RankBadge rank={user.rank} />
                    </div>
                    
                    <div className="flex-shrink-0">
                      {user.image ? (
                        <div className="relative w-12 h-12">
                          <Image
                            src={user.image}
                            alt={user.name || 'User'}
                            fill
                            className="rounded-full object-cover"
                          />
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
                        {user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/10 border-primary/20 text-primary">Admin</Badge>
                        ) : null}
                        {user.alphaUser && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-amber-500/10 border-amber-500/20 text-amber-500">Alpha</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.urlId}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2 justify-end text-foreground font-medium">
                        <span>{user.fileCount.toLocaleString()}</span>
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">files</p>
                    </div>
                    
                    <div className="flex-shrink-0 pl-2">
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
