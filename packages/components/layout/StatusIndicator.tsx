'use client'

import React, { useEffect, useState } from 'react'

interface Snapshot {
  configured: true
  url: string
  indicator: 'NONE' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'UNKNOWN'
  description: string
  maintenance: boolean
  incident: { name: string; url: string } | null
}

const REFRESH_MS = 2 * 60 * 1000

const DOT: Record<Snapshot['indicator'] | 'MAINTENANCE', string> = {
  NONE: 'bg-emerald-500',
  MINOR: 'bg-amber-400',
  MAJOR: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
  MAINTENANCE: 'bg-blue-400',
  UNKNOWN: 'bg-muted-foreground',
}

/**
 * Live status from the Emberly status page. Renders nothing when no status
 * page is configured (see STATUS_PAGE_URL).
 */
export default function StatusIndicator() {
  const [status, setStatus] = useState<Snapshot | null>(null)

  useEffect(() => {
    let active = true
    const load = () =>
      fetch('/api/status-indicator')
        .then((r) => r.json())
        .then((data) => active && setStatus(data.configured ? data : null))
        .catch(() => {})
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  if (!status) return null

  // Maintenance only takes over the colour when nothing worse is going on
  const tone =
    status.maintenance &&
    (status.indicator === 'NONE' || status.indicator === 'MINOR')
      ? 'MAINTENANCE'
      : status.indicator
  const label =
    tone === 'MAINTENANCE'
      ? 'Scheduled maintenance in progress'
      : status.description
  const href = status.incident?.url ?? status.url
  const healthy = tone === 'NONE'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={status.incident ? status.incident.name : undefined}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="relative flex h-2.5 w-2.5">
        {!healthy && tone !== 'UNKNOWN' && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${DOT[tone]}`}
          />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${DOT[tone]}`}
        />
      </span>
      {label}
    </a>
  )
}
