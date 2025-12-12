'use client'

import Link from 'next/link'

import { RefreshCcw } from 'lucide-react'

import { Icons } from '@/components/shared/icons'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-6 left-6 z-20">
        <Link href="/dashboard" className="flex items-center space-x-2.5">
          <Icons.logo className="h-6 w-6" />
          <span className="emberly-text text-lg font-medium">Emberly</span>
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center pt-24 sm:pt-12 px-4">
        <section className="max-w-7xl w-full">
          <div className="rounded-2xl overflow-hidden relative bg-gradient-to-br from-primary/10 to-accent/6 p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-60" />
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">Something went wrong</h1>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl">
                  Sorry — an unexpected error occurred while loading this page. You can try refreshing, go back home, or copy the error details and open a support request.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="rounded-md border border-white/6 bg-white/2 p-5">
                    <div className="font-medium">Error</div>
                    <div className="mt-3 text-lg md:text-xl text-muted-foreground break-words font-semibold">{error?.message || 'An unexpected error occurred'}</div>
                    {error?.digest && <div className="mt-2 text-sm text-muted-foreground">Code: {error.digest}</div>}
                  </div>

                  {process.env.NODE_ENV === 'development' && (
                    <pre className="text-sm sm:text-base bg-muted p-4 rounded overflow-auto max-h-64">{String((error as any)?.stack)}</pre>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <Link href="/">Go home</Link>
                    </Button>
                    <Button size="lg" variant="secondary" onClick={() => reset()} className="gap-2 w-full sm:w-auto">
                      <RefreshCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => navigator.clipboard?.writeText(`${error?.message}\n\n${(error as any)?.stack || ''}`)} className="w-full sm:w-auto">
                      Copy details
                    </Button>
                    <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
                      <Link href="/discord">Report issue</Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Suggested pages</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">Quick links to get you back on track</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Link href="/" className="font-medium inline-flex gap-3">
                        <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">🏠</div>
                        <div>
                          Home
                          <div className="text-xs text-muted-foreground">Start from the Emberly homepage</div>
                        </div>
                      </Link>
                    </div>

                    <div className="flex items-start gap-3">
                      <Link href="/discord" className="font-medium inline-flex gap-3">
                        <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">💬</div>
                        <div>
                          Discord
                          <div className="text-xs text-muted-foreground">Get help and chat with the community</div>
                        </div>
                      </Link>
                    </div>

                    <div className="flex items-start gap-3">
                      <Link href="/legal" className="font-medium inline-flex gap-3">
                        <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">⚖️</div>
                        <div>
                          Legal
                          <div className="text-xs text-muted-foreground">Terms, privacy, and cookies</div>
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
