import Link from 'next/link'

import { BookOpen, Check, Github, Grid, Lock } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

async function getContributors() {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    }
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`
    }

    const res = await fetch(
      'https://api.github.com/repos/EmberlyOSS/Website/contributors?per_page=12',
      {
        headers,
        // allow server-side caching for a short period
        next: { revalidate: 60 * 10 },
      }
    )

    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json)
      ? json.map((c: any) => ({
          login: c.login,
          avatar: c.avatar_url,
          url: c.html_url,
        }))
      : []
  } catch (e) {
    console.error('Failed to load contributors', e)
    return []
  }
}

export default async function AboutPage() {
  const contributors = await getContributors()

  return (
    <main className="container mx-auto py-16">
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
                    href="https://github.com/EmberlyOSS/Website"
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
                  href="https://github.com/EmberlyOSS/Website"
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
    </main>
  )
}
