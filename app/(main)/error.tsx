'use client'

import Link from 'next/link'
import { RefreshCcw } from 'lucide-react'

import { DynamicBackground } from '@/components/layout/dynamic-background'
import { DashboardNav } from '@/components/dashboard/nav'
import { UserNav } from '@/components/dashboard/user-nav'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="relative flex flex-col min-h-screen">
      <DynamicBackground />

      <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg p-2">
            <div className="relative flex h-16 items-center px-6">
              <DashboardNav />
              <div className="ml-auto flex items-center space-x-4">
                <UserNav />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pt-24 relative z-10">
        <div className="max-w-7xl mx-auto py-8 px-6">
          <Card className="rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold">Something went wrong</h1>
                <p className="mt-2 text-sm text-muted-foreground">Sorry — an unexpected error occurred while loading this page. Try refreshing, go back home, or copy the error details.</p>

                <div className="mt-4 space-y-4">
                  <div className="rounded-md border border-white/6 bg-white/2 p-4">
                    <div className="font-medium">Error</div>
                    <div className="mt-2 text-sm text-muted-foreground break-words font-semibold">{error?.message || 'An unexpected error occurred'}</div>
                    {error?.digest && <div className="mt-1 text-xs text-muted-foreground">Code: {error.digest}</div>}
                  </div>

                  {process.env.NODE_ENV === 'development' && (
                    <pre className="text-xs sm:text-sm bg-muted p-3 rounded overflow-auto max-h-48">{String((error as any)?.stack)}</pre>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button asChild size="md" className="w-full"><Link href="/dashboard">Go home</Link></Button>
                    <Button size="md" variant="secondary" onClick={() => reset()} className="w-full gap-2"><RefreshCcw className="h-4 w-4" />Try again</Button>
                    <Button size="md" variant="outline" onClick={() => navigator.clipboard?.writeText(`${error?.message}\n\n${(error as any)?.stack || ''}`)} className="w-full">Copy details</Button>
                    <Button asChild size="md" variant="ghost" className="w-full"><Link href="/discord">Report issue</Link></Button>
                  </div>
                </div>
              </div>

              <div>
                <Card className="shadow-none bg-transparent">
                  <CardHeader>
                    <CardTitle className="text-lg">Helpful links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/" className="flex items-center gap-3 p-3 rounded-md hover:bg-background/50">
                      <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-9 w-9">🏠</div>
                      <div>
                        <div className="font-medium">Home</div>
                        <div className="text-xs text-muted-foreground">Start from the Emberly homepage</div>
                      </div>
                    </Link>

                    <Link href="/discord" className="flex items-center gap-3 p-3 rounded-md hover:bg-background/50">
                      <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-9 w-9">💬</div>
                      <div>
                        <div className="font-medium">Discord</div>
                        <div className="text-xs text-muted-foreground">Get help and chat with the community</div>
                      </div>
                    </Link>

                    <Link href="/legal" className="flex items-center gap-3 p-3 rounded-md hover:bg-background/50">
                      <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-9 w-9">⚖️</div>
                      <div>
                        <div className="font-medium">Legal</div>
                        <div className="text-xs text-muted-foreground">Terms, privacy, and cookies</div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
