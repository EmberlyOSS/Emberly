import Link from 'next/link'

import { BookOpen, Check, Github, Grid, Lock } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Button } from '@/packages/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/packages/components/ui/card'
import HomeShell from '@/packages/components/layout/home-shell'

async function getContributors() {
  const ORG = 'EmberlyOSS'
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (process.env.GITHUB_PAT) {
    headers.Authorization = `token ${process.env.GITHUB_PAT}`
  }

  try {
    // Fetch org members and repo list in parallel
    const [membersRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/orgs/${ORG}/members?per_page=100`, {
        headers,
        next: { revalidate: 60 * 60 },
      }),
      fetch(`https://api.github.com/orgs/${ORG}/repos?per_page=100`, {
        headers,
        next: { revalidate: 60 * 60 },
      }),
    ])

    const membersJson = membersRes.ok ? await membersRes.json() : []
    const reposJson = reposRes.ok ? await reposRes.json() : []

    const repoNames = Array.isArray(reposJson)
      ? reposJson.map((r: any) => r.name).filter(Boolean)
      : []

    // Fetch contributors for each repo (best-effort, ignore failures)
    const contribPromises = repoNames.map((name: string) =>
      fetch(`https://api.github.com/repos/${ORG}/${name}/contributors?per_page=100`, {
        headers,
        next: { revalidate: 60 * 60 },
      })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])
    )

    const contribSettled = await Promise.allSettled(contribPromises)

    const map = new Map<string, any>()

    // Add org members first (mark as orgMember)
    if (Array.isArray(membersJson)) {
      for (const m of membersJson) {
        if (!m || !m.login) continue
        map.set(m.login.toLowerCase(), {
          login: m.login,
          avatar: m.avatar_url,
          url: m.html_url || `https://github.com/${m.login}`,
          contributions: 0,
          orgMember: true,
        })
      }
    }

    // Aggregate contributors across repos
    for (const s of contribSettled) {
      if (s.status !== 'fulfilled') continue
      const arr = s.value
      if (!Array.isArray(arr)) continue
      for (const c of arr) {
        if (!c || !c.login) continue
        const key = c.login.toLowerCase()
        const contributions = typeof c.contributions === 'number' ? c.contributions : 0
        const existing = map.get(key)
        if (existing) {
          existing.contributions = (existing.contributions || 0) + contributions
          existing.avatar = existing.avatar || c.avatar_url
          existing.url = existing.url || c.html_url
          map.set(key, existing)
        } else {
          map.set(key, {
            login: c.login,
            avatar: c.avatar_url,
            url: c.html_url,
            contributions,
            orgMember: false,
          })
        }
      }
    }

    // Convert map to array and sort: org members first, then by contributions desc
    const result = Array.from(map.values()).sort((a: any, b: any) => {
      if (a.orgMember === b.orgMember) return (b.contributions || 0) - (a.contributions || 0)
      return a.orgMember ? -1 : 1
    })

    return result
  } catch (e) {
    console.error('Failed to load contributors', e)
    return []
  }
}

export default async function AboutPage() {
  const contributors = await getContributors()

  return (
    <HomeShell className="container mx-auto py-16">
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 p-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold">Emberly</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl">
                A lightweight, developer-first file sharing platform focused on
                privacy, reliability, and simplicity. Self-hostable and
                extensible for teams and communities.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link
                    href="https://github.com/EmberlyOSS"
                    target="_blank"
                  >
                    <span className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      View on GitHub
                    </span>
                  </Link>
                </Button>

                <Button variant="outline" asChild>
                  <Link href="/docs" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Docs
                  </Link>
                </Button>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center">
              <div className="w-full max-w-sm">
                <Card>
                  <CardHeader>
                    <CardTitle>Our mission</CardTitle>
                    <CardDescription>
                      Make private, reliable file sharing accessible and easy to
                      self-host for teams and communities.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-1" />
                        <span>
                          Fast uploads with chunked and direct presigned flows
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Lock className="h-5 w-5 text-primary mt-1" />
                        <span>
                          Password-protected files and per-file visibility
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Grid className="h-5 w-5 text-primary mt-1" />
                        <span>
                          Small, focused dashboard and CMS for content &
                          management
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Why Emberly</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Emberly prioritizes speed, privacy, and pleasant UX. It’s built
                so teams can self-host without wrestling with complex
                infrastructure.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Get Involved</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Contributions, bug reports, and ideas are welcome. Check the
                repo for issues and contributor guidelines.
              </p>
              <div className="mt-4">
                <Link
                  href="https://github.com/EmberlyOSS"
                  className="text-sm underline"
                >
                  Contribute on GitHub
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Community</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Join our Discord for chat, support, and project discussion. We
                love hearing from people who self-host and build on Emberly.
              </p>
            </CardContent>
          </Card>
        </div>

        {contributors.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4">Contributors</h3>
            <div className="flex flex-wrap gap-3">
              {contributors.map((c) => (
                <Link
                  key={c.login}
                  href={c.url}
                  target="_blank"
                  className="inline-block"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={c.avatar} alt={c.login} />
                    <AvatarFallback>
                      {c.login?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </HomeShell>
  )
}
