'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { useToast } from '@/packages/hooks/use-toast'
import { Loader2, Search, GitFork, RotateCw, Info, Lock, Star } from 'lucide-react'
import { LANGUAGE_COLORS } from '../constants'
import type { GithubRepoPick } from '../types'

export function GitHubRepoPicker({
  onSelectMultiple,
  onManual,
  githubUsername,
}: {
  onSelectMultiple: (repos: GithubRepoPick[]) => void
  onManual: () => void
  githubUsername?: string | null
}) {
  const [repos, setRepos] = useState<GithubRepoPick[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showForks, setShowForks] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  const fetchRepos = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSelectedIds(new Set())
    try {
      const res = await fetch('/api/discovery/repos')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load repos')
      setRepos(json.data ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRepos() }, [fetchRepos])

  const owners = Array.from(new Set(repos.map((r) => r.owner.login))).sort((a, b) => {
    if (a === githubUsername) return -1
    if (b === githubUsername) return 1
    return a.localeCompare(b)
  })

  const filtered = repos.filter((r) => {
    if (!showForks && r.fork) return false
    if (r.archived) return false
    if (selectedOwner && r.owner.login !== selectedOwner) return false
    const q = search.toLowerCase()
    return !q || r.full_name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
  })

  const toggleRepo = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCount = selectedIds.size

  const handleSubmit = () => {
    const selected = repos.filter((r) => selectedIds.has(r.id))
    if (selected.length > 0) onSelectMultiple(selected)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading your repositories…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button size="sm" variant="outline" onClick={fetchRepos}>
          <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
        <a
          href="/api/auth/link/github"
          className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
        >
          Re-authorize GitHub to grant access to more orgs
        </a>
        <button onClick={onManual} className="text-xs text-muted-foreground underline underline-offset-2">
          Enter URL manually instead
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Info callout */}
      <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
        <span>
          Your GitHub repositories are shown here because your account is linked. Signals aren't limited to GitHub you can also add deployed apps, open source contributions, shipped products, and more.{' '}
          <button onClick={onManual} className="text-primary/80 underline underline-offset-2 hover:text-primary transition-colors">
            Add a different type of signal instead.
          </button>
        </span>
      </div>

      {/* Search + org dropdown + forks + refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories…"
            className="h-8 pl-8 text-sm"
          />
        </div>

        {owners.length > 1 && (
          <Select
            value={selectedOwner}
            onValueChange={(v) => { setSelectedOwner(v); setSelectedIds(new Set()) }}
          >
            <SelectTrigger className="h-8 text-xs max-w-[130px] shrink-0">
              <SelectValue placeholder="All owners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All owners</SelectItem>
              {owners.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}{owner === githubUsername ? ' (you)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          size="sm"
          variant={showForks ? 'secondary' : 'ghost'}
          className="h-8 text-xs shrink-0"
          onClick={() => setShowForks((v) => !v)}
        >
          <GitFork className="w-3 h-3 mr-1" /> Forks
        </Button>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={fetchRepos} title="Refresh">
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Repo list with checkboxes */}
      <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {search ? 'No matching repositories found.' : 'No repositories found.'}
          </p>
        )}
        {filtered.map((repo) => {
          const isSelected = selectedIds.has(repo.id)
          return (
            <button
              key={repo.id}
              type="button"
              onClick={() => toggleRepo(repo.id)}
              className={`group w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left select-none ${
                isSelected
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border/40 bg-background/60 hover:bg-accent hover:border-border'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                isSelected ? 'bg-primary border-primary' : 'border-border/60 group-hover:border-border'
              }`}>
                {isSelected && (
                  <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <img
                src={repo.owner.avatar_url}
                alt={repo.owner.login}
                className="w-5 h-5 rounded-full shrink-0 ring-1 ring-border/40"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-medium truncate text-foreground">
                    <span className="text-muted-foreground font-normal">{repo.owner.login}/</span>{repo.name}
                  </span>
                  {repo.private && <Lock className="w-2.5 h-2.5 text-muted-foreground/60 shrink-0" />}
                  {repo.fork && <GitFork className="w-2.5 h-2.5 text-muted-foreground/60 shrink-0" />}
                </div>
                {repo.description && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{repo.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: LANGUAGE_COLORS[repo.language] ?? '#888' }}
                    />
                    {repo.language}
                  </span>
                )}
                {repo.stargazers_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5" />
                    {repo.stargazers_count >= 1000 ? `${(repo.stargazers_count / 1000).toFixed(1)}k` : repo.stargazers_count}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[10px] text-muted-foreground">{filtered.length} repo{filtered.length !== 1 ? 's' : ''}</span>
          <a
            href="/api/auth/link/github"
            className="text-[10px] text-primary/70 underline underline-offset-2 hover:text-primary"
            title="Re-connect GitHub to grant access to additional organizations"
          >
            Grant org access
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onManual} className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground whitespace-nowrap">
            Enter manually
          </button>
          {selectedCount > 0 && (
            <Button size="sm" className="h-7 text-xs px-3" onClick={handleSubmit}>
              Add {selectedCount} signal{selectedCount !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
