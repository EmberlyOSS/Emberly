import Link from 'next/link'

import { Button } from '@/components/ui/button'

export function FlickerTool() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <img
          src="/branding/flicker/icon.svg"
          alt=""
          className="h-9 w-9 shrink-0 rounded-lg"
        />
        <div className="space-y-1">
          <h3 className="font-medium">Flicker</h3>
          <p className="text-sm text-muted-foreground">
            Our desktop app for Windows, macOS and Linux. Sign in with your
            browser; no config needed.
          </p>
        </div>
      </div>
      <Button asChild>
        <Link href="/downloads">Download</Link>
      </Button>
    </div>
  )
}
