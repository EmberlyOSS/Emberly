'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { DashboardNav } from '@/packages/components/dashboard/nav'
import { Button } from '@/packages/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/packages/components/ui/card'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const message = error?.message || 'An unexpected error occurred'
  const stack = String((error as any)?.stack || '')

  return (
    <div className="relative flex flex-col min-h-screen mt-24">
      <DynamicBackground />

      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="relative rounded-2xl border border-border/50 bg-background/85 p-2 shadow-lg backdrop-blur-xl">
            <div className="relative flex h-16 items-center px-4 sm:px-6">
              <DashboardNav />
              <div className="ml-auto flex items-center space-x-4">
                <UserNav />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/15" />
            <div className="relative p-6 sm:p-8 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Error</p>
                    <h1 className="text-2xl font-bold sm:text-3xl">Something went wrong</h1>
                    <p className="mt-2 text-sm text-muted-foreground">We hit a snag while loading this page. You can retry, head back to the dashboard, or copy the details below if you need to report it.</p>
                  </div>
                </div>
                {error?.digest && (
                  <div className="inline-flex items-center rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                    Code: {error.digest}
                  </div>
                )}
              </div>

              <div className="grid gap-4 grid-cols-1">
                <div className="space-y-4 rounded-xl border border-border/60 bg-background/80 p-4">
                  <div className="text-sm font-semibold text-foreground/90">Details</div>
                  <p className="text-sm text-muted-foreground break-words">{message}</p>
                  {process.env.NODE_ENV === 'development' && stack && (
                    <pre className="max-h-56 overflow-auto rounded-lg bg-muted/80 p-3 text-xs sm:text-sm text-foreground/80">{stack}</pre>
                  )}
                </div>

                <div className="space-y-3 rounded-xl border border-border/60 bg-background/80 p-4">
                  <div className="text-sm font-semibold text-foreground/90">Quick actions</div>
                  <div className="grid gap-3 sm:grid-cols-1">
                    <Button asChild className="w-full" size="lg" variant="destructive">
                      <Link href="/dashboard">Go to dashboard</Link>
                    </Button>
                    <Button size="lg" variant="secondary" onClick={() => reset()} className="w-full gap-2">
                      <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                      Try again
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigator.clipboard?.writeText(`${message}\n\n${stack}`)}
                      className="w-full"
                    >
                      Copy details
                    </Button>
                    <Button asChild size="lg" variant="ghost" className="w-full">
                      <Link href="/discord">Report issue</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-background/80 shadow-md backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Helpful links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Link href="/dashboard" className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-base">📂</span>
                <div className="text-sm">
                  <div className="font-semibold">Dashboard</div>
                  <div className="text-xs text-muted-foreground">Back to your files</div>
                </div>
              </Link>

              <Link href="/" className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-base">🏠</span>
                <div className="text-sm">
                  <div className="font-semibold">Home</div>
                  <div className="text-xs text-muted-foreground">Emberly landing</div>
                </div>
              </Link>

              <Link href="/discord" className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-base">💬</span>
                <div className="text-sm">
                  <div className="font-semibold">Discord</div>
                  <div className="text-xs text-muted-foreground">Get help quickly</div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main >
    </div >
  )
}
