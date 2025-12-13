import Link from 'next/link'

import MiniGame from '@/components/games/mini-game'
import { Icons } from '@/components/shared/icons'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DynamicBackground } from '@/components/layout/dynamic-background'
import { BaseNav } from '@/components/layout/base-nav'

export default function NotFound() {
  return (
    <div className="relative flex flex-col min-h-screen">
      <DynamicBackground />

      <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg p-2">
            <div className="relative flex h-16 items-center px-6">
              <BaseNav />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pt-24 relative z-10">
        <div className="max-w-7xl mx-auto py-8 px-6">
          <Card className="rounded-2xl overflow-hidden relative p-8 animate-in fade-in-50">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/6 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-40 pointer-events-none" />
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-5xl md:text-6xl font-extrabold">Page not found</h1>
                <p className="mt-4 text-muted-foreground max-w-xl">The page you were looking for doesn't exist or has been moved. Try one of the suggested pages or go back home.</p>

                <div className="mt-6 flex items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/">Go home</Link>
                  </Button>

                  <div>
                    {/* MiniGame is a client component */}
                    <MiniGame />
                  </div>
                </div>
              </div>

              <div>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Suggested pages</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">Quick links to get you back on track</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li>
                        <Link href="/" className="flex items-center gap-3 p-3 rounded-md hover:bg-background/50">
                          <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">🏠</div>
                          <div className="flex-1">
                            <div className="font-medium">Home</div>
                            <div className="text-xs text-muted-foreground">Start from the Emberly homepage</div>
                          </div>
                        </Link>
                      </li>

                      <li>
                        <Link href="/discord" className="flex items-center gap-3 p-3 rounded-md hover:bg-background/50">
                          <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">💬</div>
                          <div className="flex-1">
                            <div className="font-medium">Discord</div>
                            <div className="text-xs text-muted-foreground">Get help and chat with the community</div>
                          </div>
                        </Link>
                      </li>

                      <li>
                        <Link href="/legal" className="flex items-center gap-3 p-3 rounded-md hover:bg-background/50">
                          <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">⚖️</div>
                          <div className="flex-1">
                            <div className="font-medium">Legal</div>
                            <div className="text-xs text-muted-foreground">Terms, privacy, and cookies</div>
                          </div>
                        </Link>
                      </li>
                    </ul>
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
