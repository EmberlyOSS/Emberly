'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { Compass, FileText, Trophy, Users } from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'

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

const CATEGORIES: Array<{
  value: Category
  label: string
  icon: React.ElementType
}> = [
  { value: 'contributors', label: 'Contributors', icon: Trophy },
  { value: 'discovery', label: 'Discovery', icon: Compass },
  { value: 'squads', label: 'Squads', icon: Users },
]

// Gold, silver, bronze
const MEDAL: Record<number, string> = {
  1: 'bg-amber-400/15 text-amber-300 ring-amber-400/40',
  2: 'bg-slate-300/15 text-slate-200 ring-slate-300/40',
  3: 'bg-orange-700/20 text-orange-300 ring-orange-600/40',
}

const AVAILABILITY: Record<string, string> = {
  OPEN: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  LIMITED: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  CLOSED: 'border-border bg-muted/40 text-muted-foreground',
}

function profileHref(name: string | null) {
  return name ? `/user/${encodeURIComponent(name)}` : null
}

function RankChip({ rank }: { rank: number }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ring-1 ${
        MEDAL[rank] ?? 'bg-muted/40 text-muted-foreground ring-border'
      }`}
    >
      {rank}
    </span>
  )
}

function Avatar({
  name,
  image,
  size = 40,
  square = false,
}: {
  name: string | null
  image?: string | null
  size?: number
  square?: boolean
}) {
  const shape = square ? 'rounded-xl' : 'rounded-full'
  if (image) {
    return (
      <span
        className={`relative block shrink-0 overflow-hidden ${shape} ring-1 ring-border`}
        style={{ width: size, height: size }}
      >
        <Image src={image} alt={name || 'User'} fill className="object-cover" />
      </span>
    )
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${shape} bg-primary/15 font-semibold text-primary ring-1 ring-primary/20`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name?.charAt(0).toUpperCase() || '?'}
    </span>
  )
}

/** Link when there's somewhere to go, plain block otherwise. */
function MaybeLink({
  href,
  className,
  children,
}: {
  href: string | null
  className: string
  children: React.ReactNode
}) {
  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  )
}

interface Entry {
  key: string
  rank: number
  name: string
  image?: string | null
  href: string | null
  square?: boolean
  badge?: React.ReactNode
  subtitle?: string | null
  stat: string
  statLabel: string
}

function Podium({ entries }: { entries: Entry[] }) {
  // Visual order 2 · 1 · 3 on wide screens, natural order when stacked
  const order = [entries[1], entries[0], entries[2]]
  return (
    <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
      {order.map((e) => (
        <MaybeLink
          key={e.key}
          href={e.href}
          className={`group glass-card glass-hover flex flex-col items-center gap-3 p-6 text-center ${
            e.rank === 1 ? 'border-amber-400/30 sm:pb-9 sm:pt-8' : ''
          } ${e.rank === 1 ? 'order-first sm:order-none' : ''}`}
        >
          <RankChip rank={e.rank} />
          <Avatar
            name={e.name}
            image={e.image}
            size={e.rank === 1 ? 72 : 60}
            square={e.square}
          />
          <div className="min-w-0 w-full">
            <p className="truncate font-semibold group-hover:text-primary transition-colors">
              {e.name}
            </p>
            {e.subtitle && (
              <p className="truncate text-xs text-muted-foreground">
                {e.subtitle}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {e.stat}
            </span>{' '}
            {e.statLabel}
          </p>
        </MaybeLink>
      ))}
    </div>
  )
}

function Rankings({ entries }: { entries: Entry[] }) {
  return (
    <ol className="glass-card divide-y divide-border/60 overflow-hidden">
      {entries.map((e) => (
        <li key={e.key}>
          <MaybeLink
            href={e.href}
            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:px-5"
          >
            <RankChip rank={e.rank} />
            <Avatar name={e.name} image={e.image} size={36} square={e.square} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                  {e.name}
                </span>
                {e.badge}
              </div>
              {e.subtitle && (
                <p className="truncate text-xs text-muted-foreground">
                  {e.subtitle}
                </p>
              )}
            </div>
            <span className="shrink-0 text-right text-sm">
              <span className="font-semibold tabular-nums">{e.stat}</span>{' '}
              <span className="text-muted-foreground">{e.statLabel}</span>
            </span>
          </MaybeLink>
        </li>
      ))}
    </ol>
  )
}

function Skeleton() {
  return (
    <div className="glass-card divide-y divide-border/60 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-3 px-5 py-3"
        >
          <div className="h-7 w-7 rounded-full bg-muted/50" />
          <div className="h-9 w-9 rounded-full bg-muted/50" />
          <div className="h-3.5 w-40 rounded bg-muted/50" />
          <div className="ml-auto h-3.5 w-14 rounded bg-muted/40" />
        </div>
      ))}
    </div>
  )
}

const EMPTY: Record<Category, string> = {
  contributors:
    'No contributors yet. Upload a public file to get on the board.',
  discovery: 'No Discovery profiles yet. Be the first to create one.',
  squads: 'No active squads yet. Create one to get started.',
}

export function Leaderboard() {
  const [category, setCategory] = useState<Category>('contributors')
  const [data, setData] = useState<Partial<Record<Category, unknown[]>>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (cat: Category) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?category=${cat}`)
      const json = await res.json()
      setData((d) => ({ ...d, [cat]: Array.isArray(json) ? json : [] }))
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
      setData((d) => ({ ...d, [cat]: [] }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (data[category] === undefined) load(category)
    else setLoading(false)
  }, [category, data, load])

  const raw = data[category] ?? []
  const entries: Entry[] =
    category === 'contributors'
      ? (raw as ContributorUser[]).map((u) => ({
          key: u.id,
          rank: u.rank,
          name: u.name || 'Anonymous',
          image: u.image,
          href: profileHref(u.name),
          badge: u.alphaUser ? (
            <Badge
              variant="outline"
              className="h-4 border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] text-amber-400"
            >
              Alpha
            </Badge>
          ) : null,
          stat: u.fileCount.toLocaleString(),
          statLabel: u.fileCount === 1 ? 'file' : 'files',
        }))
      : category === 'discovery'
        ? (raw as DiscoveryUser[]).map((u) => ({
            key: u.id,
            rank: u.rank,
            name: u.name || 'Anonymous',
            image: u.image,
            href: profileHref(u.name),
            subtitle: u.title,
            badge: (
              <Badge
                variant="outline"
                className={`h-4 px-1.5 text-[10px] ${AVAILABILITY[u.availability] ?? ''}`}
              >
                {u.availability.toLowerCase()}
              </Badge>
            ),
            stat: u.signalCount.toLocaleString(),
            statLabel: 'signal',
          }))
        : (raw as Squad[]).map((s) => ({
            key: s.id,
            rank: s.rank,
            name: s.name,
            href: null,
            square: true,
            subtitle: s.description,
            stat: s.memberCount.toLocaleString(),
            statLabel: s.memberCount === 1 ? 'member' : 'members',
          }))

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Leaderboard category"
        className="inline-flex gap-1 rounded-xl border border-border/70 bg-card/60 p-1"
      >
        {CATEGORIES.map(({ value, label, icon: Icon }) => {
          const active = category === value
          return (
            <button
              key={value}
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(value)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />
              {label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <Skeleton />
      ) : entries.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div className="rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{EMPTY[category]}</p>
        </div>
      ) : (
        <>
          {entries.length >= 3 && <Podium entries={entries.slice(0, 3)} />}
          {entries.length !== 3 && (
            <Rankings
              entries={entries.length >= 3 ? entries.slice(3) : entries}
            />
          )}
        </>
      )}
    </div>
  )
}
