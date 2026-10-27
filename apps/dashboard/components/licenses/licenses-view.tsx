'use client'

import { useEffect, useMemo, useState } from 'react'

import { ChevronDown, ExternalLink, Search } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Panel } from '@/components/layout/page-kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const REPO = 'https://github.com/EmberlyOSS/Emberly/blob/master'
const RULE = '='.repeat(78)

interface Group {
  packages: string[]
  text: string
}

async function readText(path: string) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${res.status}`)
  return res.text()
}

function parsePackages(text: string): Group[] {
  return text
    .split(RULE)
    .slice(1)
    .map((block) => {
      const trimmed = block.replace(/^\n+/, '')
      const split = trimmed.indexOf('\n\n')
      return {
        packages: trimmed.slice(0, split).split('\n').filter(Boolean),
        text: trimmed.slice(split + 2).trim(),
      }
    })
}

function Missing({ file }: { file: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      This is added when Emberly is built.{' '}
      <a
        href={`${REPO}/${file}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        Read it on GitHub
      </a>
      .
    </p>
  )
}

export function LicensesView() {
  const [license, setLicense] = useState<string | null | false>(null)
  const [notices, setNotices] = useState<string | null | false>(null)
  const [groups, setGroups] = useState<Group[] | null | false>(null)
  const [showLicense, setShowLicense] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    readText('/licenses/LICENSE.txt').then(setLicense, () => setLicense(false))
    readText('/licenses/NOTICES.md').then(
      (md) => setNotices(md.replace(/^# .*\n+/, '')),
      () => setNotices(false)
    )
    readText('/licenses/packages.txt').then(
      (text) => setGroups(parsePackages(text)),
      () => setGroups(false)
    )
  }, [])

  const packageCount = groups
    ? groups.reduce((n, g) => n + g.packages.length, 0)
    : 0
  const shown = useMemo(() => {
    if (!groups) return []
    const q = query.trim().toLowerCase()
    return q
      ? groups.filter((g) =>
          g.packages.some((p) => p.toLowerCase().includes(q))
        )
      : groups
  }, [groups, query])

  return (
    <div className="space-y-6">
      <Panel
        title="Emberly"
        description="Elastic License 2.0 · Copyright NodeByte LTD"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            You can use, modify and self-host Emberly, including for your
            business. You may not offer it to others as a hosted service, or get
            around its license keys. Portions derived from Flare remain under
            the MIT License; see below.
          </p>
          {license === false ? (
            <Missing file="LICENSE" />
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLicense((v) => !v)}
                disabled={!license}
              >
                {showLicense ? 'Hide the license' : 'Read the full license'}
                <ChevronDown
                  className={`ml-1.5 h-3.5 w-3.5 transition-transform ${showLicense ? 'rotate-180' : ''}`}
                />
              </Button>
              {showLicense && license && (
                <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/20 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
                  {license}
                </pre>
              )}
            </>
          )}
        </div>
      </Panel>

      <Panel
        title="Built on open source"
        description="Projects Emberly is based on or includes directly"
      >
        {notices === false ? (
          <Missing file="THIRD_PARTY_NOTICES.md" />
        ) : notices ? (
          <div className="prose prose-sm prose-neutral max-w-none dark:prose-invert prose-headings:font-semibold prose-pre:max-h-80 prose-pre:overflow-auto prose-pre:whitespace-pre-wrap prose-pre:bg-muted/20 prose-pre:text-xs prose-pre:text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{notices}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-24 animate-pulse rounded-lg bg-muted/30" />
        )}
      </Panel>

      <Panel
        title="All packages"
        description={
          groups
            ? `The ${packageCount} open-source packages Emberly ships with, and their licenses`
            : 'Every open-source package Emberly ships with, and its license'
        }
        actions={
          groups ? (
            <Button variant="ghost" size="sm" asChild>
              <a href="/licenses/packages.txt" target="_blank" rel="noopener">
                Plain text
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          ) : undefined
        }
        flush={!!groups}
      >
        {groups === false ? (
          <Missing file="scripts/third-party-licenses.mjs" />
        ) : !groups ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted/30" />
        ) : (
          <>
            <div className="border-b border-border/50 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${packageCount} packages`}
                  aria-label="Search packages"
                  className="h-9 border-border/60 bg-background/50 pl-9"
                />
              </div>
            </div>
            {shown.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No packages match.
              </p>
            ) : (
              <ul className="divide-y divide-border/40">
                {shown.slice(0, 200).map((group, i) => (
                  <li key={i}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-5 py-3 text-sm hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0 space-y-0.5">
                          {group.packages.slice(0, 3).map((p) => (
                            <span
                              key={p}
                              className="block truncate font-mono text-xs"
                            >
                              {p}
                            </span>
                          ))}
                          {group.packages.length > 3 && (
                            <span className="block text-xs text-muted-foreground">
                              and {group.packages.length - 3} more with the same
                              license
                            </span>
                          )}
                        </span>
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="space-y-3 px-5 pb-4">
                        {group.packages.length > 3 && (
                          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                            {group.packages.slice(3).join(' · ')}
                          </p>
                        )}
                        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/20 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                          {group.text}
                        </pre>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
            {shown.length > 200 && (
              <p className="border-t border-border/50 px-5 py-3 text-center text-xs text-muted-foreground">
                Showing 200 of {shown.length} license groups. Search to find a
                specific package.
              </p>
            )}
          </>
        )}
      </Panel>
    </div>
  )
}
