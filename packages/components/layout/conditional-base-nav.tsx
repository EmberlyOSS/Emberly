'use client'

import { usePathname } from 'next/navigation'

import BaseNav from './base-nav'

export default function ConditionalBaseNav() {
  const pathname = usePathname() || ''
  // Hide base nav for dashboard routes, admin routes, me routes, and api routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/me') || pathname.startsWith('/api')) {
    return null
  }

  // Hide for file-view and shorturl routes (match patterns used by FooterWrapper)
  const excludedPatterns = ['/u/', '/raw', '/api/files/', '/shorturl', '/s/']
  const patternExcluded = excludedPatterns.some(
    (p) => pathname.startsWith(p) || pathname.includes(p)
  )
  // Detect file-view routes like `/:userUrlId/:filename` or their `/raw` variants.
  // Require the second segment to look like a filename (contain a dot) or the path to end with `/raw`.
  const looksLikeFileView = (() => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length < 2) return false
    const second = parts[1] || ''
    const hasDot = second.includes('.')
    const endsWithRaw = pathname.endsWith('/raw')
    return hasDot || endsWithRaw
  })()

  if (patternExcluded || looksLikeFileView) return null

  return (
    <>
      <BaseNav />
      <div aria-hidden className="h-24" />
    </>
  )
}
