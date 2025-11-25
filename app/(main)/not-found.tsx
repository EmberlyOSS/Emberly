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

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="flex items-center space-x-2.5">
          <Icons.logo className="h-6 w-6" />
          <span className="emberly-text text-lg font-medium">Emberly</span>
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center py-12">
        <section className="max-w-7xl w-full px-4">
          <div className="rounded-2xl overflow-hidden relative bg-gradient-to-br from-primary/10 to-accent/6 p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-60" />
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-5xl md:text-6xl font-extrabold">
                  Page not found
                </h1>
                <p className="mt-4 text-muted-foreground max-w-xl">
                  The page you were looking for doesn't exist or has been moved.
                  Try one of the suggested pages or go back home.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/">Go home</Link>
                  </Button>

                  <div>
                    {/* Mini-game launcher */}
                    {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
                    {/* MiniGame is a client component */}
                    <MiniGame />
                  </div>
                </div>
              </div>

              <div>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Suggested pages</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Quick links to get you back on track
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Link href="/" className="font-medium inline-flex gap-3">
                        <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">
                          🏠
                        </div>
                        <div>
                          Home
                          <div className="text-xs text-muted-foreground">
                            Start from the Emberly homepage
                          </div>
                        </div>
                      </Link>
                    </div>

                    <div className="flex items-start gap-3">
                      <Link
                        href="/discord"
                        className="font-medium inline-flex gap-3"
                      >
                        <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">
                          💬
                        </div>
                        <div>
                          Discord
                          <div className="text-xs text-muted-foreground">
                            Get help and chat with the community
                          </div>
                        </div>
                      </Link>
                    </div>

                    <div className="flex items-start gap-3">
                      <Link
                        href="/legal"
                        className="font-medium inline-flex gap-3"
                      >
                        <div className="p-2 rounded-md bg-primary/10 flex items-center justify-center h-10 w-10">
                          ⚖️
                        </div>
                        <div>
                          Legal
                          <div className="text-xs text-muted-foreground">
                            Terms, privacy, and cookies
                          </div>
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
