'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Skeleton } from '@/packages/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { GRANT_META, ALL_GRANTS } from '@/packages/lib/grants/constants'
import HomeShell from '@/packages/components/layout/home-shell'
import { type NexiumPublicProfileData } from './nexium-public-section'
import { SignalCard } from './signal-card'
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
  BarChart2,
  Code2,
  GitMerge,
  Package,
  Users,
  Layers,
  Award,
  HeartHandshake,
  Headset,
  ShieldCheck,
  Palette,
  Handshake,
} from 'lucide-react'
import { SiDiscord, SiGithub as SiGithubIcon } from 'react-icons/si'
import { SkillIcon } from './skill-icons'
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

const signalTypeIcons: Record<string, React.ReactNode> = {
  GITHUB_REPO: <SiGithubIcon className="w-3.5 h-3.5" />,
  DEPLOYED_APP: <Globe className="w-3.5 h-3.5" />,
  OPEN_SOURCE_CONTRIBUTION: <GitMerge className="w-3.5 h-3.5" />,
  SHIPPED_PRODUCT: <Package className="w-3.5 h-3.5" />,
  COMMUNITY_IMPACT: <Users className="w-3.5 h-3.5" />,
  ASSET_PACK: <Layers className="w-3.5 h-3.5" />,
  CERTIFICATION: <Award className="w-3.5 h-3.5" />,
  OTHER: <FileText className="w-3.5 h-3.5" />,
}

const signalTypeColors: Record<string, string> = {
  GITHUB_REPO: 'bg-zinc-500/15 text-zinc-400',
  DEPLOYED_APP: 'bg-blue-500/15 text-blue-400',
  OPEN_SOURCE_CONTRIBUTION: 'bg-emerald-500/15 text-emerald-400',
  SHIPPED_PRODUCT: 'bg-orange-500/15 text-orange-400',
  COMMUNITY_IMPACT: 'bg-pink-500/15 text-pink-400',
  ASSET_PACK: 'bg-purple-500/15 text-purple-400',
  CERTIFICATION: 'bg-amber-500/15 text-amber-400',
  OTHER: 'bg-muted/50 text-muted-foreground',
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
    grants: string[]
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

  const hasGitHub = !!(linkedAccounts?.github || user.github)
  const hasNexium = !!nexiumProfile

  const [activeTab, setActiveTab] = useState('overview')
  const [contribsLoaded, setContribsLoaded] = useState(false)

  // Lazy-load contributions only when the tab is first opened
  useEffect(() => {
    if (activeTab === 'contributions' && !contribsLoaded && hasGitHub) {
      setContribsLoaded(true)
      setLoadingContribs(true)
      fetch(`/api/users/${user.id}/contributions`)
        .then(r => r.json())
        .then(data => setContributions(data))
        .catch(console.error)
        .finally(() => setLoadingContribs(false))
    }
  }, [activeTab, contribsLoaded, hasGitHub, user.id])

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
  const badges: Array<{ label: string; icon: React.ReactNode; className: string; gradient?: string }> = []

  const CONTRIBUTOR_TIER_STYLES: Record<string, { className: string; gradient: string }> = {
    Bronze:   { className: 'text-amber-700 dark:text-amber-500 border-amber-600/40',   gradient: 'from-amber-800/30 via-amber-700/20 to-amber-600/10' },
    Silver:   { className: 'text-slate-400 dark:text-slate-300 border-slate-400/40',   gradient: 'from-slate-500/30 via-slate-400/20 to-slate-300/10' },
    Gold:     { className: 'text-yellow-500 dark:text-yellow-400 border-yellow-500/40', gradient: 'from-yellow-600/30 via-yellow-500/20 to-yellow-300/10' },
    Platinum: { className: 'text-cyan-400 dark:text-cyan-300 border-cyan-400/40',      gradient: 'from-cyan-500/30 via-cyan-400/20 to-cyan-300/10' },
    Diamond:  { className: 'text-sky-300 dark:text-sky-200 border-sky-400/50',         gradient: 'from-sky-500/40 via-indigo-400/25 to-violet-400/15' },
  }

  const BOOSTER_TIER_STYLES: Record<string, { className: string; gradient: string }> = {
    Bronze:   { className: 'text-amber-700 dark:text-amber-500 border-amber-600/40',   gradient: 'from-amber-800/30 via-amber-700/20 to-amber-600/10' },
    Silver:   { className: 'text-slate-400 dark:text-slate-300 border-slate-400/40',   gradient: 'from-slate-500/30 via-slate-400/20 to-slate-300/10' },
    Gold:     { className: 'text-yellow-500 dark:text-yellow-400 border-yellow-500/40', gradient: 'from-yellow-600/30 via-yellow-500/20 to-yellow-300/10' },
    Platinum: { className: 'text-fuchsia-400 dark:text-fuchsia-300 border-fuchsia-400/40', gradient: 'from-fuchsia-600/30 via-purple-500/20 to-pink-400/10' },
    Diamond:  { className: 'text-purple-300 dark:text-purple-200 border-purple-400/50',    gradient: 'from-purple-600/40 via-fuchsia-500/25 to-pink-400/15' },
  }

  if (hasContributor && contributorInfo) {
    const style = CONTRIBUTOR_TIER_STYLES[contributorInfo.tier] ?? CONTRIBUTOR_TIER_STYLES.Bronze
    badges.push({
      label: `${contributorInfo.tier} Contributor`,
      icon: <SiGithubIcon className="w-3 h-3" />,
      className: style.className,
      gradient: style.gradient,
    })
  }
  if (hasDiscordBooster && boosterInfo) {
    const style = BOOSTER_TIER_STYLES[boosterInfo.tier] ?? BOOSTER_TIER_STYLES.Bronze
    badges.push({
      label: `${boosterInfo.tier} Booster`,
      icon: <SiDiscord className="w-3 h-3" />,
      className: style.className,
      gradient: style.gradient,
    })
  }
  if (hasAffiliate) {
    badges.push({ label: 'Affiliate', icon: <Star className="w-3 h-3" />, className: 'text-blue-500 dark:text-blue-400 border-blue-500/40', gradient: 'from-blue-600/25 via-blue-500/15 to-blue-400/5' })
  }
  if (user.role === 'SUPERADMIN') {
    badges.push({ label: 'Super Admin', icon: <Shield className="w-3 h-3" />, className: 'text-red-500 dark:text-red-400 border-red-500/40', gradient: 'from-red-600/25 via-red-500/15 to-orange-400/5' })
  } else if (user.role === 'ADMIN') {
    badges.push({ label: 'Admin', icon: <Shield className="w-3 h-3" />, className: 'text-orange-500 dark:text-orange-400 border-orange-500/40', gradient: 'from-orange-600/25 via-orange-500/15 to-amber-400/5' })
  }
  if (user.alphaUser) {
    badges.push({ label: 'Alpha Member', icon: <Sparkles className="w-3 h-3" />, className: 'text-amber-400 dark:text-amber-300 border-amber-400/40', gradient: 'from-amber-500/25 via-yellow-400/15 to-amber-300/5' })
  }

  // Grant badges — awarded via applications or manually by superadmin
  const GRANT_ICON_MAP: Record<string, React.ReactNode> = {
    HeartHandshake: <HeartHandshake className="w-3 h-3" />,
    Headset:        <Headset className="w-3 h-3" />,
    Code2:          <Code2 className="w-3 h-3" />,
    ShieldCheck:    <ShieldCheck className="w-3 h-3" />,
    Palette:        <Palette className="w-3 h-3" />,
    Handshake:      <Handshake className="w-3 h-3" />,
  }
  for (const grant of ALL_GRANTS) {
    if (user.grants.includes(grant)) {
      const meta = GRANT_META[grant]
      badges.push({
        label: meta.label,
        icon: GRANT_ICON_MAP[meta.icon] ?? <Award className="w-3 h-3" />,
        className: meta.className,
        gradient: meta.gradient,
      })
    }
  }

  // Determine which tabs to show
  const showContributions = hasGitHub
  const showFiles = user._count.files > 0 || loadingFiles

  const defaultTab = 'overview'

  return (
    <HomeShell>
      <div className="space-y-4 sm:space-y-6">

        {/* â”€â”€ Hero Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                      <Image src={user.image} alt={displayName} fill className="object-cover" priority />
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
              </div>

              {canReport && (
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0 hidden sm:flex" onClick={() => setReportOpen(true)}>
                  <Flag className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Social links */}
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
                  <SiDiscord className="w-3.5 h-3.5" style={{ color: '#5865F2' }} /> {linkedAccounts?.discord || user.discord}
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
              <div className="flex flex-wrap gap-2 mt-4">
                {badges.map((b) => (
                  <div key={b.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium bg-gradient-to-r ${b.gradient ?? ''} ${b.className}`}>
                    {b.icon}
                    <span>{b.label}</span>
                  </div>
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

        {/* â”€â”€ Stats Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€ Tabbed Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Tabs defaultValue={defaultTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto inline-flex gap-1 glass-subtle p-1 rounded-xl h-auto">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              Files
              {user._count.files > 0 && (
                <span className="text-xs bg-muted/80 data-[state=active]:bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
                  {user._count.files}
                </span>
              )}
            </TabsTrigger>
            {showContributions && (
              <TabsTrigger
                value="contributions"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm"
              >
                <Code2 className="w-3.5 h-3.5" />
                Contributions
              </TabsTrigger>
            )}
          </TabsList>

          {/* â”€â”€ Overview Tab â”€â”€ */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Skills */}
            {hasNexium && nexiumProfile!.skills.length > 0 && (
              <GlassCard>
                <div className="p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Skills</h2>
                  <div className="space-y-4">
                    {Object.entries(
                      nexiumProfile!.skills.reduce<Record<string, typeof nexiumProfile.skills>>((acc, s) => {
                        const cat = s.category || 'General'
                        acc[cat] = [...(acc[cat] ?? []), s]
                        return acc
                      }, {})
                    ).map(([cat, catSkills]) => (
                      <div key={cat}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">{cat}</p>
                        <div className="flex flex-wrap gap-2">
                          {catSkills.map((skill) => (
                            <div key={skill.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-background/40 hover:bg-background/60 transition-colors">
                              <SkillIcon name={skill.name} className="w-3.5 h-3.5 shrink-0" />
                              <span className="text-sm font-medium">{skill.name}</span>
                              <SkillLevelBar level={skill.level} />
                              {skill.yearsExperience != null && (
                                <span className="text-[10px] text-muted-foreground border-l border-border/50 pl-1.5">{skill.yearsExperience}y</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Proof of Skill / Signals */}
            {hasNexium && nexiumProfile!.signals.length > 0 && (
              <GlassCard>
                <div className="p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Proof of Skill</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {nexiumProfile!.signals.map((signal) => (
                      <SignalCard key={signal.id} signal={signal} />
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Empty overview state */}
            {!hasNexium && (
              <GlassCard>
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">No additional profile info available.</p>
                </div>
              </GlassCard>
            )}
          </TabsContent>

          {/* â”€â”€ Files Tab â”€â”€ */}
          <TabsContent value="files" className="mt-4">
            <GlassCard>
              <div className="p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Public Files <span className="text-muted-foreground/50">({files.length})</span>
                </h2>

                {loadingFiles && files.length === 0 ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : files.length > 0 ? (
                  <div className="space-y-1">
                    {files.slice(0, 20).map((file) => (
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
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No public files yet.</p>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* â”€â”€ Contributions Tab â”€â”€ */}
          {showContributions && (
            <TabsContent value="contributions" className="mt-4 space-y-4">
              {loadingContribs && !contributions ? (
                <GlassCard>
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </GlassCard>
              ) : contributions && contributions.linesOfCode > 0 ? (
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
                            {repo.language && <span className="text-muted-foreground">Â· {repo.language}</span>}
                            {repo.stars > 0 && <span className="text-muted-foreground flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{repo.stars}</span>}
                          </a>
                        ))}
                      </div>
                    )}

                    {contributions.recentCommits && contributions.recentCommits.length > 0 && (
                      <div className="space-y-1">
                        {contributions.recentCommits.slice(0, 8).map((commit: any) => (
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
              ) : (
                <GlassCard>
                  <div className="p-8 text-center text-muted-foreground">
                    <Github className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No contribution data available.</p>
                  </div>
                </GlassCard>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {canReport && (
        <ReportUserDialog userId={user.id} userName={displayName} open={reportOpen} onOpenChange={setReportOpen} />
      )}
    </HomeShell>
  )
}
