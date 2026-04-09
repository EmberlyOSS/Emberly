'use client'

import {
  ExternalLink,
  Star,
  GitFork,
  CheckCircle,
  Globe,
  GitMerge,
  Package,
  Users,
  Layers,
  Award,
  FileText,
  Lock,
} from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import { NEXIUM_SIGNAL_TYPE_LABELS } from '@/packages/lib/nexium/constants'

// ── Language colour map (GitHub linguist palette) ─────────────────────────────

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C#': '#178600',
  'C++': '#f34b7d',
  C: '#555555',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Nix: '#7e7eff',
  Lua: '#000080',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Vue: '#41b883',
  Svelte: '#ff3e00',
}

// ── Signal type meta ──────────────────────────────────────────────────────────

const SIGNAL_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; dot: string }> = {
  GITHUB_REPO:              { icon: <SiGithub className="w-3.5 h-3.5" />,   color: 'text-foreground/70 bg-muted/60 border-border/60',           dot: 'bg-foreground/40' },
  DEPLOYED_APP:             { icon: <Globe className="w-3.5 h-3.5" />,       color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',            dot: 'bg-blue-500' },
  OPEN_SOURCE_CONTRIBUTION: { icon: <GitMerge className="w-3.5 h-3.5" />,   color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',   dot: 'bg-emerald-500' },
  SHIPPED_PRODUCT:          { icon: <Package className="w-3.5 h-3.5" />,     color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',      dot: 'bg-orange-500' },
  COMMUNITY_IMPACT:         { icon: <Users className="w-3.5 h-3.5" />,       color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',            dot: 'bg-pink-500' },
  ASSET_PACK:               { icon: <Layers className="w-3.5 h-3.5" />,      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',      dot: 'bg-purple-500' },
  CERTIFICATION:            { icon: <Award className="w-3.5 h-3.5" />,       color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',         dot: 'bg-amber-500' },
  OTHER:                    { icon: <FileText className="w-3.5 h-3.5" />,    color: 'text-muted-foreground bg-muted/40 border-border/50',         dot: 'bg-muted-foreground/60' },
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type SignalCardData = {
  id: string
  type: string
  title: string
  url: string | null
  description: string | null
  imageUrl: string | null
  verified: boolean
  metadata?: {
    full_name?: string
    stargazers_count?: number
    forks_count?: number
    language?: string | null
    topics?: string[]
    owner?: { login?: string; avatar_url?: string }
    private?: boolean
    [key: string]: unknown
  } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ── GitHub repo card ──────────────────────────────────────────────────────────

function GitHubRepoCard({ signal }: { signal: SignalCardData }) {
  const meta = signal.metadata
  const fullName = meta?.full_name ?? signal.title
  const [owner, repoName] = fullName.includes('/') ? fullName.split('/') : [null, fullName]
  const avatarUrl = meta?.owner?.avatar_url
  const description = signal.description ?? (typeof meta?.description === 'string' ? meta.description : null)
  const stars = typeof meta?.stargazers_count === 'number' ? meta.stargazers_count : null
  const forks = typeof meta?.forks_count === 'number' ? meta.forks_count : null
  const language = typeof meta?.language === 'string' ? meta.language : null
  const isPrivate = meta?.private === true
  const topics: string[] = Array.isArray(meta?.topics) ? (meta!.topics as string[]).slice(0, 4) : []
  const langColor = language ? (LANGUAGE_COLORS[language] ?? 'hsl(var(--muted-foreground))') : null

  const card = (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-md hover:shadow-black/5 overflow-hidden">
      {/* Subtle top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-2.5 min-w-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={owner ?? ''}
            className="w-5 h-5 rounded-full ring-1 ring-border/50 shrink-0"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-muted shrink-0 flex items-center justify-center">
            <SiGithub className="w-3 h-3 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium leading-none truncate">
            {owner && (
              <span className="text-muted-foreground font-normal">{owner}/</span>
            )}
            <span className="text-primary">{repoName}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isPrivate && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/50 rounded px-1.5 py-0.5">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          )}
          {signal.verified && (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          )}
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
      )}

      {/* Topics */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {topics.map((t) => (
            <span
              key={t}
              className="text-[10px] font-medium text-primary/70 bg-primary/8 border border-primary/15 rounded-full px-2 py-0.5 leading-none"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Footer stats */}
      {(language || stars !== null || forks !== null) && (
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5 border-t border-border/40">
          {language && langColor && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: langColor }} />
              {language}
            </span>
          )}
          {stars !== null && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {formatCount(stars)}
            </span>
          )}
          {forks !== null && (
            <span className="flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              {formatCount(forks)}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (signal.url) {
    return (
      <a href={signal.url} target="_blank" rel="noopener noreferrer" className="block">
        {card}
      </a>
    )
  }
  return card
}

// ── Generic signal card ───────────────────────────────────────────────────────

function GenericSignalCard({ signal }: { signal: SignalCardData }) {
  const typeLabel = NEXIUM_SIGNAL_TYPE_LABELS[signal.type as keyof typeof NEXIUM_SIGNAL_TYPE_LABELS] ?? signal.type
  const config = SIGNAL_TYPE_CONFIG[signal.type] ?? SIGNAL_TYPE_CONFIG.OTHER
  const imageUrl = signal.imageUrl ?? (typeof signal.metadata?.imageUrl === 'string' ? signal.metadata.imageUrl : null)

  const card = (
    <div className="group relative flex items-start gap-3.5 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-md hover:shadow-black/5 overflow-hidden">
      {/* Subtle top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Icon / image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border/50 ring-1 ring-border/30"
        />
      ) : (
        <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border ${config.color}`}>
          {config.icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Type badge */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${config.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
            {typeLabel}
          </span>
          {signal.verified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-500">
              <CheckCircle className="w-2.5 h-2.5" /> Verified
            </span>
          )}
        </div>

        <p className="text-sm font-semibold leading-snug truncate text-foreground">{signal.title}</p>
        {signal.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{signal.description}</p>
        )}
      </div>

      {signal.url && (
        <ExternalLink className="shrink-0 mt-0.5 w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
      )}
    </div>
  )

  if (signal.url) {
    return (
      <a href={signal.url} target="_blank" rel="noopener noreferrer" className="block">
        {card}
      </a>
    )
  }
  return card
}

// ── Public export ─────────────────────────────────────────────────────────────

export function SignalCard({ signal }: { signal: SignalCardData }) {
  if (signal.type === 'GITHUB_REPO') {
    return <GitHubRepoCard signal={signal} />
  }
  return <GenericSignalCard signal={signal} />
}
