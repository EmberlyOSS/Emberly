import { NextRequest, NextResponse } from 'next/server'

import { FILE_URL_PATTERN, VIDEO_EXTENSIONS } from './constants'

export function isBotRequest(userAgent: string): boolean {
  userAgent = userAgent.toLowerCase()
  return (
    userAgent.includes('bot') ||
    userAgent.includes('discord') ||
    userAgent.includes('telegram') ||
    userAgent.includes('twitter') ||
    userAgent.includes('facebook') ||
    userAgent.includes('linkedin') ||
    userAgent.includes('whatsapp')
  )
}

export async function handleBotRequest(
  request: NextRequest
): Promise<NextResponse | null> {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  const pathname =
    request.nextUrl.pathname.length > 1
      ? request.nextUrl.pathname.replace(/\/$/, '')
      : request.nextUrl.pathname

  if (
    !isBotRequest(userAgent) ||
    !FILE_URL_PATTERN.test(request.nextUrl.pathname)
  ) {
    return null
  }

  const fileExt = pathname.split('.').pop()?.toLowerCase()
  const isVideo = fileExt && VIDEO_EXTENSIONS.includes(fileExt)
  const isRawPath = pathname.endsWith('/raw')
  const isDirectPath = pathname.endsWith('/direct')

  // Extract user ID and filename from pathname: /[userUrlId]/[filename]
  const pathMatch = pathname.match(/^\/([^/]+)\/([^/]+)/)
  if (!pathMatch) {
    return NextResponse.next()
  }

  const [, userUrlId, filename] = pathMatch
  const urlPath = `/${userUrlId}/${filename}`

  // Check user's enableRichEmbeds setting via internal API
  // This is necessary because middleware runs on Edge runtime and can't use Prisma directly
  let enableRichEmbeds = true // default to true
  try {
    // Call the app directly rather than round-tripping through the CDN:
    // unfurlers like Discord give up on slow pages
    const internalBase = `http://localhost:${process.env.PORT || 3000}`

    const response = await fetch(
      `${internalBase}/api/internal/file-settings?urlPath=${encodeURIComponent(urlPath)}`,
      { signal: AbortSignal.timeout(2000) }
    )
    if (response.ok) {
      const data = await response.json()
      enableRichEmbeds = data.enableRichEmbeds !== false
    }
  } catch {
    // If lookup fails, default to allowing rich embeds
    enableRichEmbeds = true
  }

  if (enableRichEmbeds) {
    // Rich embeds enabled: serve the page with branded metadata
    if (!isRawPath && !isDirectPath && request.nextUrl.pathname === pathname) {
      const url = new URL(request.url)
      url.pathname = `${pathname}/`
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  } else {
    // Rich embeds disabled: serve the raw file at this URL. A rewrite, not a
    // redirect: Discord is inconsistent about embedding media behind one.
    if (!isRawPath && !isDirectPath) {
      const url = new URL(request.url)
      url.pathname = `${pathname}/raw`
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }
}
