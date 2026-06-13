'use client'

import React from 'react'

export default function StatusIndicator() {
  return (
    <a
      href="https://emberlystat.us"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
      System Status
    </a>
  )
}
