'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Skeleton } from '@/packages/components/ui/skeleton'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import HomeShell from '@/packages/components/layout/home-shell'
import { type NexiumPublicProfileData } from './nexium-public-section'
import {
  NEXIUM_AVAILABILITY_LABELS,
  NEXIUM_SKILL_LEVEL_LABELS,
  NEXIUM_SIGNAL_TYPE_LABELS,
} from '@/packages/lib/nexium/constants'
import {
  Star,
  Github,
  Zap,
  Calendar,
  Trophy,
  Sparkles,
  Globe,
  ExternalLink,
  MessageCircle,
  FileText,
  Download,
  Eye,
  Check,
  Shield,
  Flag,
  CheckCircle,
  MapPin,
  Clock,
} from 'lucide-react'
import { ReportUserDialog } from './report-user-dialog'

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

const PERK_ROLES = {
  CONTRIBUTOR: 'CONTRIBUTOR',
  DISCORD_BOOSTER: 'DISCORD_BOOSTER',
  AFFILIATE: 'AFFILIATE',
}

const skillLevelStyle: Record<string, string> = {
  BEGINNER: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
  INTERMEDIATE: 'text-green-500 border-green-500/30 bg-green-500/10',
  ADVANCED: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
  EXPERT: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
}

const availabilityStyle: Record<string, string> = {
  OPEN: 'text-green-600 border-green-500/30 bg-green-500/10',
  LIMITED: 'text-yellow-600 border-yellow-500/30 bg-yellow-500/10',
  CLOSED: 'text-muted-foreground',
}

interface PublicProfileProps {
  user: {
    id: string
    name: string | null
    fullName: string | null
    image: string | null
    banner: string | null
    avatarDecoration: string | null
    isVerified: boolean
    bio: string | null
    website: string | null
    twitter: string | null
    github: string | null
    discord: string | null
    createdAt: Date
    urlId: string
    vanityId: string | null
    perkRoles: string[]
    role: string
    alphaUser: boolean
    _count: {
      files: number
    }
  }
  storageBonus: number
  domainBonus: number
  linkedAccounts?: {
    github?: string
    discord?: string
  }
  contributorInfo?: {
    linesOfCode: number
    tier: string
    icon: string
    storageGB: number
    domainSlots: number
  }
  boosterInfo?: {
    months: number
    tier: string
    icon: string
    storageGB: number
    domainSlots: number
  }
  leaderboardRank?: number | null
  nexiumProfile?: NexiumPublicProfileData | null
  currentUserId?: string | null
}

export function PublicProfile({ user, storageBonus, domainBonus, linkedAccounts, contributorInfo, boosterInfo, leaderboardRank, nexiumProfile, currentUserId }: PublicProfileProps) {
  const displayName = user.name || 'Anonymous User'
  const memberSince = format(user.createdAt, 'MMMM yyyy')
  const [contributions, setContributions] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const [loadingContribs, setLoadingContribs] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const isOwnProfile = !!currentUserId && currentUserId === user.id
  const canReport = !!currentUserId && !isOwnProfile

  const hasContributor = user.perkRoles.some((p) => p.startsWith('CONTRIBUTOR'))
  const hasDiscordBooster = user.perkRoles.some((p) => p.startsWith('DISCORD_BOOSTER'))
  const hasAffiliate = user.perkRoles.includes(PERK_ROLES.AFFILIATE)

  // Auto-load contributions
  useEffect(() => {
    if (linkedAccounts?.github) {
      setLoadingContribs(true)
      fetch(`/api/users/${user.id}/contributions`)
        .then(r => r.json())
        .then(data => setContributions(data))
        .catch(console.error)
        .finally(() => setLoadingContribs(false))
    }
  }, [user.id, linkedAccounts])

  // Auto-load public files
  useEffect(() => {
    setLoadingFiles(true)
    fetch(`/api/users/${user.id}/public-files`)
      .then(r => r.json())
      .then(data => setFiles(data.files || []))
      .catch(console.error)
      .finally(() => setLoadingFiles(false))
  }, [user.id])

  // Collect all badges
  const badges: Array<{ label: string; icon: React.ReactNode; className: string }> = []

  if (hasContributor && contributorInfo) {
    badges.push({ label: `${contributorInfo.icon} ${contributorInfo.tier} Contributor`, icon: <Github className="w-3 h-3" />, className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' })
  }
  if (hasDiscordBooster && boosterInfo) {
    badges.push({ label: `${boosterInfo.icon} ${boosterInfo.tier} Booster`, icon: <Zap className="w-3 h-3" />, className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30' })
  }
  if (hasAffiliate) {
    badges.push({ label: 'Affiliate', icon: <Star className="w-3 h-3" />, className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' })
  }
  if (user.role === 'SUPERADMIN') {
    badges.push({ label: 'Super Admin', icon: <Shield className="w-3 h-3" />, className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30' })
  } else if (user.role === 'ADMIN') {
    badges.push({ label: 'Admin', icon: <Shield className="w-3 h-3" />, className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30' })
  }
  if (user.alphaUser) {
    badges.push({ label: 'Alpha Member', icon: <Sparkles className="w-3 h-3" />, className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' })
  }

  return (
    <HomeShell>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Hero Card ─────────────────────────────────────────────── */}
        <GlassCard>
          {user.banner && (
            <div className="relative w-full h-36 md:h-52">
              <Image src={user.banner} alt="" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
            </div>
          )}

          <div className={`px-6 md:px-8 pb-6 ${user.banner ? '-mt-16 relative z-10' : 'pt-6'}`}>
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                {user.image ? (
                  <div className="rounded-2xl border-4 border-background shadow-xl overflow-hidden w-28 h-28 md:w-36 md:h-36">
                    <div className="relative w-full h-full">
                      <Image
                        src={user.image}
                        alt={displayName}
                        fill
                        className="object-cover"
                        priority
                      />
                      {user.avatarDecoration && (
                        <Image src={user.avatarDecoration} alt="" fill className="object-cover pointer-events-none" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center border-4 border-background shadow-xl">
                    <span className="text-4xl md:text-5xl font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Name + Meta */}
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">{displayName}</h1>
                  {user.isVerified && (
                    <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10 gap-1 py-0.5 px-2 text-xs">
                      <Check className="w-3 h-3" /> Verified
                    </Badge>
                  )}
                  {leaderboardRank && (
                    <Link href="/leaderboard">
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer gap-1 py-0.5 px-2 text-xs">
                        <Trophy className="w-3 h-3" /> #{leaderboardRank}
                      </Badge>
                    </Link>
                  )}
                </div>

                {user.fullName && <p className="text-sm text-muted-foreground">{user.fullName}</p>}

                {nexiumProfile?.title && (
                  <p className="text-sm font-medium text-foreground/70 mt-0.5">{nexiumProfile.title}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {memberSince}</span>
                  {nexiumProfile?.location && (
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {nexiumProfile.location}</span>
                  )}
                  {nexiumProfile?.timezone && (
                    <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {nexiumProfile.timezone}</span>
                  )}
                  {nexiumProfile?.activeHours && (
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {nexiumProfile.activeHours}</span>
                  )}
                  {nexiumProfile && (
                    <Badge variant="outline" className={`text-xs gap-1 py-0 px-2 ${availabilityStyle[nexiumProfile.availability] ?? ''}`}>
                      {NEXIUM_AVAILABILITY_LABELS[nexiumProfile.availability as keyof typeof NEXIUM_AVAILABILITY_LABELS]}
                    </Badge>
                  )}
                </div>

                {user.bio && <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{user.bio}</p>}
                {nexiumProfile?.headline && !user.bio && <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{nexiumProfile.headline}</p>}
                {nexiumProfile?.headline && user.bio && nexiumProfile.headline !== user.bio && (
                  <p className="text-xs text-muted-foreground mt-1">{nexiumProfile.headline}</p>
                )}
              </div>

              {canReport && (
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0 hidden sm:flex" onClick={() => setReportOpen(true)}>
                  <Flag className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Social links + Looking For */}
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-background/50 text-xs hover:border-primary/30 transition-colors">
                  <Globe className="w-3.5 h-3.5" /> {user.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
              {(linkedAccounts?.github || user.github) && (
                <a href={`https://github.com/${linkedAccounts?.github || user.github}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-background/50 text-xs hover:border-primary/30 transition-colors">
                  <Github className="w-3.5 h-3.5" /> {linkedAccounts?.github || user.github}
                </a>
              )}
              {user.twitter && (
                <a href={`https://x.com/${user.twitter.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-background/50 text-xs hover:border-primary/30 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  {user.twitter}
                </a>
              )}
              {(linkedAccounts?.discord || user.discord) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-background/50 text-xs">
                  <MessageCircle className="w-3.5 h-3.5" /> {linkedAccounts?.discord || user.discord}
                </span>
              )}

              {nexiumProfile && nexiumProfile.lookingFor.length > 0 && (
                <>
                  <span className="w-px h-5 bg-border/50 mx-1 hidden sm:block" />
                  {nexiumProfile.lookingFor.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs py-0.5 px-2">{tag}</Badge>
                  ))}
                </>
              )}
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {badges.map((b) => (
                  <Badge key={b.label} variant="outline" className={`gap-1 text-xs ${b.className}`}>
                    {b.icon} {b.label}
                  </Badge>
                ))}
              </div>
            )}

            {canReport && (
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive sm:hidden mt-3" onClick={() => setReportOpen(true)}>
                <Flag className="w-3.5 h-3.5 mr-1.5" /> Report
              </Button>
            )}
          </div>
        </GlassCard>

        {/* ── Stats Row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GlassCard>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{user._count.files}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Public Files</p>
            </div>
          </GlassCard>
          {contributorInfo && (
            <GlassCard>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{contributorInfo.linesOfCode.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Lines Contributed</p>
              </div>
            </GlassCard>
          )}
          {storageBonus > 0 && (
            <GlassCard>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{storageBonus}GB</div>
                <p className="text-xs text-muted-foreground mt-0.5">Storage Bonus</p>
              </div>
            </GlassCard>
          )}
          {domainBonus > 0 && (
            <GlassCard>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{domainBonus}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Custom Domains</p>
              </div>
            </GlassCard>
          )}
        </div>

        {/* ── Skills ────────────────────────────────────────────────── */}
        {nexiumProfile && nexiumProfile.skills.length > 0 && (
          <GlassCard>
            <div className="p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {nexiumProfile.skills.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-background/50 text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${skillLevelStyle[skill.level] ?? ''}`}>
                      {NEXIUM_SKILL_LEVEL_LABELS[skill.level as keyof typeof NEXIUM_SKILL_LEVEL_LABELS]}
                    </Badge>
                    {skill.yearsExperience != null && (
                      <span className="text-[10px] text-muted-foreground">{skill.yearsExperience}y</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── Signals / Proof of Skill ──────────────────────────────── */}
        {nexiumProfile && nexiumProfile.signals.length > 0 && (
          <GlassCard>
            <div className="p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Proof of Skill</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {nexiumProfile.signals.map((signal) => (
                  <div key={signal.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-background/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-medium text-primary/80 uppercase tracking-wider">
                          {NEXIUM_SIGNAL_TYPE_LABELS[signal.type as keyof typeof NEXIUM_SIGNAL_TYPE_LABELS]}
                        </span>
                        {signal.verified && (
                          <Badge variant="outline" className="text-[10px] gap-0.5 py-0 px-1.5 text-green-600 border-green-500/30 bg-green-500/10">
                            <CheckCircle className="w-2.5 h-2.5" /> Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{signal.title}</p>
                      {signal.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{signal.description}</p>
                      )}
                    </div>
                    {signal.url && (
                      <Button size="sm" variant="ghost" asChild className="shrink-0 h-7 px-2">
                        <a href={signal.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── GitHub Contributions ───────────────────────────────────── */}
        {linkedAccounts?.github && (
          <>
            {loadingContribs && !contributions && (
              <GlassCard>
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </GlassCard>
            )}

            {contributions && contributions.linesOfCode > 0 && (
              <GlassCard>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contributions</h2>
                    {contributions.stats && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-emerald-600 dark:text-emerald-400">+{contributions.stats.totalAdditions.toLocaleString()}</span>
                        <span className="text-red-500">-{contributions.stats.totalDeletions.toLocaleString()}</span>
                        <span>{contributions.stats.totalRepos} repo{contributions.stats.totalRepos !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {contributions.repos && contributions.repos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {contributions.repos.map((repo: any) => (
                        <a key={repo.url} href={repo.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-background/50 text-xs hover:border-primary/30 transition-colors group">
                          <Github className="w-3 h-3" />
                          <span className="font-medium group-hover:text-primary transition-colors">{repo.name}</span>
                          {repo.language && <span className="text-muted-foreground">· {repo.language}</span>}
                          {repo.stars > 0 && <span className="text-muted-foreground flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{repo.stars}</span>}
                        </a>
                      ))}
                    </div>
                  )}

                  {contributions.recentCommits && contributions.recentCommits.length > 0 && (
                    <div className="space-y-1">
                      {contributions.recentCommits.slice(0, 5).map((commit: any) => (
                        <a key={commit.sha} href={commit.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors group">
                          <code className="text-[10px] font-mono text-muted-foreground shrink-0 group-hover:text-primary transition-colors">{commit.sha}</code>
                          <span className="text-sm truncate flex-1 group-hover:text-primary transition-colors">{commit.message}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{commit.repo}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">+{commit.additions}</span>
                          <span className="text-[10px] text-red-500 shrink-0">-{commit.deletions}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* ── Public Files ──────────────────────────────────────────── */}
        {loadingFiles && files.length === 0 && (
          <GlassCard>
            <div className="p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </GlassCard>
        )}

        {files.length > 0 && (
          <GlassCard>
            <div className="p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Public Files <span className="text-muted-foreground/50">({files.length})</span>
              </h2>
              <div className="space-y-1">
                {files.slice(0, 10).map((file) => (
                  <a key={file.id} href={`https://embrly.ca/${file.url}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors group">
                    <FileText className="w-4 h-4 text-primary/60 shrink-0 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium truncate flex-1 group-hover:text-primary transition-colors">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{file.views.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />{file.downloads.toLocaleString()}</span>
                  </a>
                ))}
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {canReport && (
        <ReportUserDialog userId={user.id} userName={displayName} open={reportOpen} onOpenChange={setReportOpen} />
      )}
    </HomeShell>
  )
}
