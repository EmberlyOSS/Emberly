import Link from 'next/link'

import { Github, Twitter } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Footer() {
  return (
    <footer className="w-full py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-accent/3 rounded-2xl pointer-events-none" />
          <div className="relative bg-background/40 backdrop-blur-xl border border-border/50 rounded-2xl px-6 py-4 shadow-lg shadow-black/5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} Emberly. All rights
                  reserved.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/60 backdrop-blur-sm border-border/50"
                  asChild
                >
                  <Link
                    href="https://github.com/EmberlyOSS/Website"
                    target="_blank"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/60 backdrop-blur-sm border-border/50"
                  asChild
                >
                  <Link href="https://twitter.com/TryEmberly" target="_blank">
                    <Twitter className="mr-2 h-4 w-4" />
                    Follow
                  </Link>
                </Button>

                <Link
                  href="/legal"
                  className="text-sm underline text-muted-foreground"
                >
                  Legal Hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
