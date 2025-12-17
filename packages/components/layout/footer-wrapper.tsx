'use client'

import { usePathname } from 'next/navigation'

import { Footer } from './footer'

interface FooterWrapperProps {
  showFooter?: boolean
}

// Client wrapper that hides the footer on routes used for viewing uploads
export default function FooterWrapper({
  showFooter = true,
}: FooterWrapperProps) {
  const pathname = usePathname() || ''

  // Exclude known file-view routes (short urls and raw views)
  // Also exclude dynamic file pages like `/:userUrlId/:filename` and their `/raw` variants
  const excludedPatterns = ['/u/', '/raw', '/api/files/', '/shorturl', '/s/']

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

  const patternExcluded = excludedPatterns.some(
    (p) => pathname.startsWith(p) || pathname.includes(p)
  )

  const shouldHide = looksLikeFileView || patternExcluded

  if (!showFooter || shouldHide) return null

  return <Footer />
}
