'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { ExternalLink, GitBranch, Search, Tag } from 'lucide-react'

import MarkdownRenderer from '@/packages/components/shared/MarkdownRenderer'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { Skeleton } from '@/packages/components/ui/skeleton'
import { getRelativeTime } from '@/packages/lib/utils'

type Release = {
  id: number
  repo: string
  tagName: string
  name: string
  body: string
  htmlUrl: string
  publishedAt: string
  author?: { login: string; avatar?: string }
}

// Notes longer than this start clipped with a "show more" toggle
const LONG_NOTES = 700

const PROSE =
  'prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-code:rounded prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-border/50 prose-pre:bg-muted/30'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ReleaseNotes({
  body,
  startOpen,
}: {
  body: string
  startOpen: boolean
}) {
  const long = body.length > LONG_NOTES
  const [open, setOpen] = useState(startOpen || !long)

  return (
    <div className="space-y-2">
      <div className={`relative ${open ? '' : 'max-h-56 overflow-hidden'}`}>
        <div className={PROSE}>
          <MarkdownRenderer>
            {body || '*No release notes provided.*'}
          </MarkdownRenderer>
        </div>
        {!open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
        )}
      </div>
      {long && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-sm font-medium text-primary hover:underline underline-offset-4"
        >
          {open ? 'Show less' : 'Show full notes'}
        </button>
      )}
    </div>
  )
}

export default function ChangelogList({ org }: { org?: string }) {
  const [releases, setReleases] = useState<Release[] | null>(null)
  const [q, setQ] = useState('')
  const [repoFilter, setRepoFilter] = useState<string>('all')

  useEffect(() => {
    let mounted = true
    const path = org
      ? `/api/changelogs?org=${encodeURIComponent(org)}`
      : '/api/changelogs'
    fetch(path)
      .then((r) => r.json())
      .then(
        (j) =>
          mounted && setReleases(Array.isArray(j?.releases) ? j.releases : [])
      )
      .catch(() => mounted && setReleases([]))
    return () => {
      mounted = false
    }
  }, [org])

  const repos = useMemo(
    () =>
      releases ? Array.from(new Set(releases.map((r) => r.repo))).sort() : [],
    [releases]
  )

  const filtered = useMemo(() => {
    if (!releases) return []
    const term = q.trim().toLowerCase()
    return releases.filter((r) => {
      if (repoFilter !== 'all' && r.repo !== repoFilter) return false
      if (!term) return true
      return (
        r.name.toLowerCase().includes(term) ||
        r.body.toLowerCase().includes(term) ||
        r.repo.toLowerCase().includes(term) ||
        r.tagName.toLowerCase().includes(term)
      )
    })
  }, [releases, q, repoFilter])

  const filtering = q.trim() !== '' || repoFilter !== 'all'
  const reset = () => {
    setQ('')
    setRepoFilter('all')
  }

  return (
    <div className="space-y-8">
      <div className="glass-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search releases…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={repoFilter} onValueChange={setRepoFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {repos.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtering && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="shrink-0"
          >
            Clear
          </Button>
        )}
      </div>

      {!releases ? (
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-card space-y-3 p-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-72" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div className="rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            {filtering
              ? 'No releases match your search.'
              : 'No releases published yet.'}
          </p>
          {filtering && (
            <Button variant="outline" size="sm" onClick={reset}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {filtering && (
            <p className="text-sm text-muted-foreground">
              {filtered.length} of {releases.length} releases
            </p>
          )}
          <ol className="relative ml-2 space-y-8 border-l border-border/70 sm:ml-3">
            {filtered.map((rel, index) => (
              <li key={rel.id} className="relative pl-6 sm:pl-8">
                <span
                  className={`absolute -left-[5px] top-6 h-2.5 w-2.5 rounded-full ring-4 ring-background ${
                    index === 0 ? 'bg-primary' : 'bg-muted-foreground/50'
                  }`}
                />
                <article className="glass-card p-5 sm:p-6">
                  <header className="mb-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                        <GitBranch className="h-3 w-3" />
                        {rel.repo}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Tag className="h-3 w-3" />
                        {rel.tagName}
                      </span>
                      <time
                        dateTime={rel.publishedAt}
                        title={formatDate(rel.publishedAt)}
                      >
                        {formatDate(rel.publishedAt)} ·{' '}
                        {getRelativeTime(new Date(rel.publishedAt))}
                      </time>
                      {index === 0 && !filtering && (
                        <span className="rounded-md border border-primary/30 px-1.5 py-0.5 font-medium text-primary">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold tracking-tight">
                        {rel.name}
                      </h2>
                      <a
                        href={rel.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${rel.name} on GitHub`}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </header>

                  <ReleaseNotes body={rel.body} startOpen={index === 0} />

                  {rel.author && (
                    <footer className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                      {rel.author.avatar && (
                        <img
                          src={rel.author.avatar}
                          alt=""
                          className="h-5 w-5 rounded-full ring-1 ring-border"
                        />
                      )}
                      Released by{' '}
                      <span className="font-medium text-foreground">
                        {rel.author.login}
                      </span>
                    </footer>
                  )}
                </article>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
