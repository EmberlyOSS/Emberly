import Link from 'next/link'

import { Github, Twitter } from 'lucide-react'

import { isCloudEnabledClient } from '@/packages/lib/config/env'
import { DISCORD_INVITE_URL } from '@/packages/lib/constants/site'
import { Button } from '@/packages/components/ui/button'
import StatusIndicator from '@/packages/components/layout/StatusIndicator'
import { SiDiscord } from 'react-icons/si'

export function Footer() {
  const cloudEnabled = isCloudEnabledClient()

  return (
    <footer className="w-full py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative glass rounded-2xl px-6 py-4 gradient-border-animated">
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} NodeByte LTD. All rights
                reserved.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="https://github.com/EmberlyOSS" target="_blank">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </Link>
              </Button>

              <Button variant="outline" size="sm" asChild>
                <Link href="https://twitter.com/TryEmberly" target="_blank">
                  <Twitter className="mr-2 h-4 w-4" />
                  Follow
                </Link>
              </Button>

              <Button variant="outline" size="sm" asChild>
                <Link
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SiDiscord className="mr-2 h-4 w-4" />
                  Support
                </Link>
              </Button>

              {cloudEnabled && (
                <Link
                  href="/legal"
                  className="text-sm underline text-muted-foreground"
                >
                  Legal Hub
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
