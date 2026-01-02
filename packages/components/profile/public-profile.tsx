'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
import { Skeleton } from '@/packages/components/ui/skeleton'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import HomeShell from '@/packages/components/layout/home-shell'
import {
  Star,
  Github,
  Zap,
  Award,
  Calendar,
  Trophy,
  Sparkles,
  Globe,
  ExternalLink,
  MessageCircle,
  FileText,
  Download,
  Eye,
  Code,
  Check,
  Shield,
} from 'lucide-react'

// Reusable GlassCard component (consistent with other pages)
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  )
}

const PERK_ROLES = {
  CONTRIBUTOR: 'CONTRIBUTOR',
  DISCORD_BOOSTER: 'DISCORD_BOOSTER',
  AFFILIATE: 'AFFILIATE',
}

interface PublicProfileProps {
  user: {
    id: string
    name: string | null
    image: string | null
    bio: string | null
    website: string | null
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
}

export function PublicProfile({ user, storageBonus, domainBonus, linkedAccounts, contributorInfo, boosterInfo, leaderboardRank }: PublicProfileProps) {
  const displayName = user.name || 'Anonymous User'
  const memberSince = format(user.createdAt, 'MMMM yyyy')
  const [activeTab, setActiveTab] = useState('overview')
  const [contributions, setContributions] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Get perk information
  const hasContributor = user.perkRoles.some((p) => p.startsWith('CONTRIBUTOR'))
  const hasDiscordBooster = user.perkRoles.some((p) => p.startsWith('DISCORD_BOOSTER'))
  const hasAffiliate = user.perkRoles.includes(PERK_ROLES.AFFILIATE)

  // Fetch contributions when tab changes
  useEffect(() => {
    if (activeTab === 'contributions' && !contributions && linkedAccounts?.github) {
      setLoading(true)
      fetch(`/api/users/${user.id}/contributions`)
        .then(r => r.json())
        .then(data => setContributions(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [activeTab, contributions, user.id, linkedAccounts])

  // Fetch files when tab changes
  useEffect(() => {
    if (activeTab === 'files' && files.length === 0) {
      setLoading(true)
      fetch(`/api/users/${user.id}/public-files`)
        .then(r => r.json())
        .then(data => setFiles(data.files || []))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [activeTab, files, user.id])

  return (
    <HomeShell>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <GlassCard className="mb-6">
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.image ? (
                  <div className="relative w-24 h-24 md:w-32 md:h-32">
                    <Image
                      src={user.image}
                      alt={displayName}
                      fill
                      className="rounded-full object-cover border-2 border-primary/30"
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="text-3xl md:text-4xl font-bold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold">{displayName}</h1>
                  {leaderboardRank && (
                    <Link href="/leaderboard" className="animate-in fade-in zoom-in duration-500">
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer gap-1.5 py-1 px-2.5 h-auto text-sm">
                        <Trophy className="w-3.5 h-3.5" />
                        Rank #{leaderboardRank}
                      </Badge>
                    </Link>
                  )}
                </div>                
                <p className="text-muted-foreground flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4" />
                  Member since {memberSince}
                </p>

                {/* Bio */}
                {user.bio && (
                  <p className="text-foreground/80 mb-4 text-sm md:text-base">{user.bio}</p>
                )}

                {/* Website & Social Links */}
                <div className="flex flex-wrap gap-3 items-center">
                  {user.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={user.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        Website
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  {linkedAccounts?.github && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://github.com/${linkedAccounts.github}`} target="_blank" rel="noopener noreferrer">
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Badges */}
            {user.perkRoles.length > 0 && (
              <div className="mt-6 pt-6 border-t border-primary/10">
                <div className="flex flex-wrap gap-2">
                  {hasContributor && contributorInfo && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1"
                    >
                      <Github className="w-3 h-3" />
                      {contributorInfo.icon} {contributorInfo.tier} Contributor
                    </Badge>
                  )}
                  {hasDiscordBooster && boosterInfo && (
                    <Badge
                      variant="outline"
                      className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      {boosterInfo.icon} {boosterInfo.tier} Booster
                    </Badge>
                  )}
                  {hasAffiliate && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1"
                    >
                      <Star className="w-3 h-3" />
                      Affiliate
                    </Badge>
                  )}
                  {user.role === 'SUPERADMIN' && (
                    <Badge
                      variant="outline"
                      className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      Super Admin
                    </Badge>
                  )}
                  {user.role === 'ADMIN' && (
                    <Badge
                      variant="outline"
                      className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30 gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      Admin
                    </Badge>
                  )}
                  {user.alphaUser && (
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Alpha Member
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">{renderOverviewTab()}</TabsContent>

          {/* Contributions Tab */}
          <TabsContent value="contributions" className="space-y-6">{renderContributionsTab()}</TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">{renderFilesTab()}</TabsContent>
        </Tabs>
      </div>
    </HomeShell>
  )

  function renderOverviewTab() {
    return (
      <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{user._count.files}</div>
              <p className="text-sm text-muted-foreground">Public Files</p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{storageBonus}GB</div>
              <p className="text-sm text-muted-foreground">Storage Bonus</p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{domainBonus}</div>
              <p className="text-sm text-muted-foreground">Custom Domains</p>
            </div>
          </GlassCard>
        </div>

        {/* Perk Benefits Card */}
        {user.perkRoles.length > 0 && (
          <GlassCard className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Active Perks & Benefits
              </h2>

              <div className="space-y-4">
                {hasContributor && contributorInfo && (
                  <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-start gap-3">
                      <Github className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1 flex items-center gap-2">
                          <span>{contributorInfo.icon}</span>
                          GitHub Contributor - {contributorInfo.tier}
                        </h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                          Contributed {contributorInfo.linesOfCode.toLocaleString()} lines of code to EmberlyOSS projects
                        </p>
                        <ul className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
                          <li>✓ +{contributorInfo.storageGB >= 1 ? `${contributorInfo.storageGB}GB` : `${contributorInfo.storageGB * 1000}MB`} bonus storage ({contributorInfo.tier} tier)</li>
                          <li>✓ +{contributorInfo.domainSlots} custom domain slot{contributorInfo.domainSlots > 1 ? 's' : ''}</li>
                          <li>✓ Priority support and bug reports</li>
                          <li>✓ Early access to beta features</li>
                          <li>✓ Contributor badge and community recognition</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {hasDiscordBooster && boosterInfo && (
                  <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1 flex items-center gap-2">
                          <span>{boosterInfo.icon}</span>
                          Discord Booster - {boosterInfo.tier}
                        </h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                          Boosting for {boosterInfo.months} month{boosterInfo.months !== 1 ? 's' : ''} - Thank you for supporting the community!
                        </p>
                        <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                          <li>✓ +{boosterInfo.storageGB}GB bonus storage ({boosterInfo.tier} tier)</li>
                          <li>✓ +{boosterInfo.domainSlots} custom domain slot{boosterInfo.domainSlots > 1 ? 's' : ''}</li>
                          <li>✓ Exclusive Discord role and server perks</li>
                          <li>✓ Priority support in Discord</li>
                          <li>✓ Booster badge and recognition</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {hasAffiliate && (
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Affiliate Partner
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                          Official Emberly affiliate partner promoting the platform
                        </p>
                        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                          <li>✓ Earn commission on successful referrals</li>
                          <li>✓ Custom referral codes and tracking</li>
                          <li>✓ Marketing materials and support</li>
                          <li>✓ Partner badge on profile</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        )}

        {/* How to Earn Perks Card */}
        <GlassCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              How to Earn Perks
            </h2>

            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Github className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Contribute to Open Source
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Contribute 1000+ lines of code to EmberlyOSS repositories to unlock the Contributor perk and earn storage bonuses.
                </p>
                <Button variant="link" size="sm" asChild className="p-0 h-auto">
                  <a href="https://github.com/EmberlyOSS" target="_blank" rel="noopener noreferrer">
                    View GitHub →
                  </a>
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Boost on Discord
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Boost the Emberly Discord server to earn 5GB extra storage and an additional custom domain slot.
                </p>
                <Button variant="link" size="sm" asChild className="p-0 h-auto">
                  <a href="/discord" target="_blank" rel="noopener noreferrer">
                    Join Discord →
                  </a>
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Become an Affiliate
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Refer friends and earn billing credits for each successful referral. No limits on earnings!
                </p>
                <Button variant="link" size="sm" asChild className="p-0 h-auto">
                  <Link href="/dashboard/profile?tab=referrals">
                    Learn More →
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </>
    )
  }

  function renderContributionsTab() {
    if (!linkedAccounts?.github) {
      return (
        <GlassCard>
          <div className="p-8 text-center">
            <Github className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No GitHub Account Connected</h3>
            <p className="text-muted-foreground">
              This user hasn't connected their GitHub account yet.
            </p>
          </div>
        </GlassCard>
      )
    }

    if (loading && !contributions) {
      return (
        <GlassCard>
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </GlassCard>
      )
    }

    if (!contributions || !contributions.linesOfCode) {
      return (
        <GlassCard>
          <div className="p-8 text-center">
            <Code className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Contributions Yet</h3>
            <p className="text-muted-foreground">
              This user hasn't contributed to any Emberly repositories yet.
            </p>
          </div>
        </GlassCard>
      )
    }

    return (
      <>
        {/* Contribution Stats */}
        <GlassCard>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Code className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">GitHub Contributions</h2>
                <p className="text-sm text-muted-foreground">
                  Total lines of code contributed to Emberly
                </p>
              </div>
            </div>
            <div className="text-4xl font-bold text-primary">
              {contributions.linesOfCode.toLocaleString()}
            </div>
            {contributorInfo && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <span className="text-lg">{contributorInfo.icon}</span>
                <span className="text-sm font-medium">{contributorInfo.tier} Contributor</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Repositories */}
        {contributions.repos && contributions.repos.length > 0 && (
          <GlassCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contributed Repositories</h3>
              <div className="space-y-4">
                {contributions.repos.map((repo: any) => (
                  <div
                    key={repo.url}
                    className="p-4 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-semibold text-primary hover:underline flex items-center gap-2"
                        >
                          {repo.name}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-primary"></span>
                              {repo.language}
                            </span>
                          )}
                          {repo.stars > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {repo.stars.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Contribution Stats */}
        {contributions.stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard>
              <div className="p-6 text-center">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {contributions.stats.totalAdditions.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Lines Added</p>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="p-6 text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                  {contributions.stats.totalDeletions.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Lines Deleted</p>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {contributions.stats.totalFilesChanged.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Files Changed</p>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Recent Commits */}
        {contributions.recentCommits && contributions.recentCommits.length > 0 && (
          <GlassCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Commits</h3>
              <div className="space-y-3">
                {contributions.recentCommits.map((commit: any) => (
                  <a
                    key={commit.sha}
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-lg border border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                        {commit.sha}
                      </code>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Github className="w-3 h-3" />
                            {commit.repo}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {commit.filesChanged} file{commit.filesChanged !== 1 ? 's' : ''}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +{commit.additions}
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            -{commit.deletions}
                          </span>
                          <span>
                            {new Date(commit.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </GlassCard>
        )}
      </>
    )
  }

  function renderFilesTab() {
    if (loading && files.length === 0) {
      return (
        <GlassCard>
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </GlassCard>
      )
    }

    if (files.length === 0) {
      return (
        <GlassCard>
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Public Files</h3>
            <p className="text-muted-foreground">
              This user hasn't uploaded any public files yet.
            </p>
          </div>
        </GlassCard>
      )
    }

    return (
      <GlassCard>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Public Files</h2>
              <p className="text-sm text-muted-foreground">
                {files.length} file{files.length !== 1 ? 's' : ''} shared publicly
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {files.map((file) => (
              <a
                key={file.id}
                href={`https://embrly.ca/${file.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-lg border border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {file.name}
                      </h3>
                      <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {file.views.toLocaleString()} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {file.downloads.toLocaleString()} downloads
                      </span>
                      <span>
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </GlassCard>
    )
  }
}
