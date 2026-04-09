import Link from 'next/link'
import Image from 'next/image'

import {
  ArrowRight,
  MapPin,
  Search,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import type { NexiumAvailability } from '@/prisma/generated/prisma/client'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import HomeShell from '@/packages/components/layout/home-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { listProfiles } from '@/packages/lib/nexium/profiles'
import { prisma } from '@/packages/lib/database/prisma'
import {
  NEXIUM_AVAILABILITY_LABELS,
  NEXIUM_LOOKING_FOR_LABELS,
  type NexiumLookingFor,
} from '@/packages/lib/nexium/constants'

export const metadata = buildPageMetadata({
  title: 'Discovery — Find Talent',
  description:
    'Find creators, developers, and community leaders available for collaboration, contracts, and full-time roles.',
})

function availabilityBadgeClass(a: string) {
  if (a === 'OPEN') return 'bg-green-500/15 text-green-400 border-green-500/30'
  if (a === 'LIMITED') return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  return 'bg-muted/40 text-muted-foreground border-muted'
}

function buildUrl(params: Record<string, string | undefined>, current: URLSearchParams) {
  const next = new URLSearchParams(current)
  for (const [k, v] of Object.entries(params)) {
    if (v) next.set(k, v)
    else next.delete(k)
  }
  const qs = next.toString()
  return `/discovery${qs ? `?${qs}` : ''}`
}

export default async function NexiumDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const availability = sp.availability as NexiumAvailability | undefined
  const lookingFor = sp.lookingFor as string | undefined
  const skill = sp.skill as string | undefined

  const [{ profiles, total }, totalAll] = await Promise.all([
    listProfiles({ availability, lookingFor, skill, limit: 48 }),
    prisma.nexiumProfile.count({ where: { isVisible: true } }),
  ])

  const currentParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === 'string')
    )
  )

  const isFiltered = !!(availability || lookingFor || skill)

  return (
    <HomeShell>
      <div className="container space-y-8">

        {/* -- Hero -- */}
        <div className="glass-card overflow-hidden gradient-border-animated">
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Talent Discovery
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  Find your next
                  <span className="text-gradient"> collaborator.</span>
                </h1>
                <p className="text-muted-foreground max-w-lg leading-relaxed">
                  Browse creators, developers, and community leaders open to opportunities proof-backed by
                  real work and verified skills.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-subtle text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{totalAll}</span>
                  <span className="text-muted-foreground">public profiles</span>
                </div>
                <Button asChild className="group">
                  <Link href="/dashboard/discovery">
                    Set up your profile
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* -- Filters -- */}
        <div className="rounded-2xl glass p-5 space-y-4">
          {/* Skill search */}
          <form method="GET" action="/discovery" className="relative">
            {availability && <input type="hidden" name="availability" value={availability} />}
            {lookingFor && <input type="hidden" name="lookingFor" value={lookingFor} />}
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              name="skill"
              defaultValue={skill ?? ''}
              placeholder="Search by skill (e.g. React, Rust, Community�)"
              className="w-full bg-transparent border border-border/50 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors"
            />
          </form>

          {/* Availability filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium w-20">Availability</span>
            <Link
              href={buildUrl({ availability: undefined }, currentParams)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${!availability ? 'bg-primary/15 text-primary border-primary/30' : 'border-border/50 hover:bg-muted/30 text-muted-foreground'}`}
            >
              All
            </Link>
            {(Object.entries(NEXIUM_AVAILABILITY_LABELS) as [string, string][]).map(([val, label]) => (
              <Link
                key={val}
                href={buildUrl({ availability: val }, currentParams)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${availability === val ? availabilityBadgeClass(val) : 'border-border/50 hover:bg-muted/30 text-muted-foreground'}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Looking-for filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium w-20">Looking for</span>
            <Link
              href={buildUrl({ lookingFor: undefined }, currentParams)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${!lookingFor ? 'bg-primary/15 text-primary border-primary/30' : 'border-border/50 hover:bg-muted/30 text-muted-foreground'}`}
            >
              All
            </Link>
            {(Object.entries(NEXIUM_LOOKING_FOR_LABELS) as [NexiumLookingFor, string][]).map(([val, label]) => (
              <Link
                key={val}
                href={buildUrl({ lookingFor: val }, currentParams)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${lookingFor === val ? 'bg-primary/15 text-primary border-primary/30' : 'border-border/50 hover:bg-muted/30 text-muted-foreground'}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {isFiltered && (
            <div className="pt-1">
              <Link href="/discovery" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Clear all filters
              </Link>
            </div>
          )}
        </div>

        {/* -- Results -- */}
        <div>
          <p className="text-sm text-muted-foreground mb-5">
            {isFiltered
              ? `${total} result${total !== 1 ? 's' : ''} for your filters`
              : `${total} public profile${total !== 1 ? 's' : ''}`}
          </p>

          {profiles.length === 0 ? (
            <div className="rounded-2xl glass p-16 text-center space-y-3">
              <Zap className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground">No profiles match your filters.</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/discovery">Clear filters</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {profiles.map((profile) => {
                const displayName = profile.user.fullName ?? profile.user.name ?? 'Unknown'
                const username = profile.user.name ?? profile.user.urlId
                const profileHref = `/user/${username}`
                const topSkills = profile.skills.slice(0, 4)

                return (
                  <Link
                    key={profile.id}
                    href={profileHref}
                    className="group glass-card overflow-hidden border border-transparent hover:border-primary/20 transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
                  >
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      {/* Avatar + availability */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="relative">
                          {profile.user.image ? (
                            <Image
                              src={profile.user.image}
                              alt={displayName}
                              width={48}
                              height={48}
                              className="rounded-full object-cover ring-2 ring-border/30"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-border/30">
                              <span className="text-lg font-semibold text-primary">
                                {displayName[0]?.toUpperCase() ?? '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${availabilityBadgeClass(profile.availability)}`}>
                          {NEXIUM_AVAILABILITY_LABELS[profile.availability as keyof typeof NEXIUM_AVAILABILITY_LABELS]}
                        </span>
                      </div>

                      {/* Name + title */}
                      <div>
                        <p className="font-semibold text-sm leading-tight">{displayName}</p>
                        {profile.title && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.title}</p>
                        )}
                      </div>

                      {/* Headline */}
                      {profile.headline && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {profile.headline}
                        </p>
                      )}

                      {/* Location */}
                      {(profile as any).location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{(profile as any).location}</span>
                        </div>
                      )}

                      {/* Skills */}
                      {topSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto pt-1">
                          {topSkills.map((s) => (
                            <span
                              key={s.id}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                            >
                              {s.name}
                            </span>
                          ))}
                          {profile.skills.length > 4 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground border border-muted">
                              +{profile.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Looking-for tags */}
                      {profile.lookingFor.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.lookingFor.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground border border-muted/30"
                            >
                              {NEXIUM_LOOKING_FOR_LABELS[tag as NexiumLookingFor] ?? tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </HomeShell>
  )
}
