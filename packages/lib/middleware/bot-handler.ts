import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/packages/lib/database/prisma'

import { FILE_URL_PATTERN, VIDEO_EXTENSIONS } from './constants'

const RICH_EMBED_TTL_MS = 60_000
const richEmbedCache = new Map<string, { enabled: boolean; expires: number }>()

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

async function richEmbedsEnabled(urlPath: string): Promise<boolean> {
  const cached = richEmbedCache.get(urlPath)
  if (cached && cached.expires > Date.now()) return cached.enabled

  try {
    const file = await prisma.file.findUnique({
      where: { urlPath },
      select: { user: { select: { enableRichEmbeds: true } } },
    })
    const enabled = file?.user?.enableRichEmbeds !== false
    if (richEmbedCache.size > 5000) richEmbedCache.clear()
    richEmbedCache.set(urlPath, {
      enabled,
      expires: Date.now() + RICH_EMBED_TTL_MS,
    })
    return enabled
  } catch {
    return true
  }
}

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
  const enableRichEmbeds = await richEmbedsEnabled(
    `/${decodeSegment(userUrlId)}/${decodeSegment(filename)}`
  )

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
