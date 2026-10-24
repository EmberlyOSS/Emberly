'use client'

import { useSyncExternalStore } from 'react'

import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { FlickerRelease } from '@/lib/downloads/flicker'

type Platform = 'windows' | 'mac' | 'linux'

function detectPlatform(): Platform | null {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const value = `${nav.userAgentData?.platform ?? ''} ${nav.userAgent}`
  if (/android|iphone|ipad|ipod/i.test(value)) return null
  if (/win/i.test(value)) return 'windows'
  if (/mac/i.test(value)) return 'mac'
  if (/linux|x11|cros/i.test(value)) return 'linux'
  return null
}

const noop = () => () => {}

const NAMES: Record<Platform, string> = {
  windows: 'Windows',
  mac: 'macOS',
  linux: 'Linux',
}

/** The big button: the right installer for the visitor's system, or a jump to the list. */
export function FlickerDownloadButton({
  release,
}: {
  release: FlickerRelease
}) {
  const platform = useSyncExternalStore(noop, detectPlatform, () => null)

  const file =
    platform === 'windows'
      ? release.windows[0]
      : platform === 'mac'
        ? release.macArm[0]
        : platform === 'linux'
          ? release.linux[0]
          : undefined

  if (!platform || !file) {
    return (
      <Button size="lg" asChild>
        <a href="#platforms">
          <Download className="mr-2 h-4 w-4" />
          Download Flicker
        </a>
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Button size="lg" asChild>
        <a href={file.url}>
          <Download className="mr-2 h-4 w-4" />
          Download for {NAMES[platform]}
        </a>
      </Button>
      <p className="text-xs text-muted-foreground">
        {platform === 'mac' && release.macIntel[0] ? (
          <>
            For Apple silicon Macs.{' '}
            <a
              href={release.macIntel[0].url}
              className="text-primary hover:underline"
            >
              Intel Mac?
            </a>
          </>
        ) : (
          <>
            {file.label} ·{' '}
            <a href="#platforms" className="text-primary hover:underline">
              Other systems
            </a>
          </>
        )}
      </p>
    </div>
  )
}
