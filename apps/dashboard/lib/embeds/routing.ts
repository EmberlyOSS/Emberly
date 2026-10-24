import { prisma } from '@emberly/db'
import { NextRequest, NextResponse } from 'next/server'

import { VIDEO_EXTENSIONS } from '@/lib/middleware/constants'

import { isPreviewable } from './preview-rules'

const FILE_PATH =
  /^\/([A-Za-z0-9]{5})\/([^/]+\.[^/]+?)(?:\/(raw|direct|preview\.webp))?\/?$/

const BOT_MARKERS = [
  'bot',
  'discord',
  'telegram',
  'twitter',
  'facebook',
  'linkedin',
  'whatsapp',
  'slack',
  'embedly',
  'mastodon',
]

const LOOKUP_TTL_MS = 60_000
const lookups = new Map<
  string,
  { richEmbeds: boolean; mimeType: string | null; expires: number }
>()

export function isBotRequest(userAgent: string) {
  const ua = userAgent.toLowerCase()
  return BOT_MARKERS.some((marker) => ua.includes(marker))
}

function decode(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

async function lookup(urlPath: string) {
  const cached = lookups.get(urlPath)
  if (cached && cached.expires > Date.now()) return cached

  let entry = { richEmbeds: true, mimeType: null as string | null }
  try {
    const file = await prisma.file.findUnique({
      where: { urlPath },
      select: { mimeType: true, user: { select: { enableRichEmbeds: true } } },
    })
    if (file) {
      entry = {
        richEmbeds: file.user?.enableRichEmbeds !== false,
        mimeType: file.mimeType,
      }
    }
  } catch {}

  if (lookups.size > 5000) lookups.clear()
  const result = { ...entry, expires: Date.now() + LOOKUP_TTL_MS }
  lookups.set(urlPath, result)
  return result
}

// Built from request.url, not nextUrl, which drops the trailing slash the
// file page is served from
function rewrite(request: NextRequest, pathname: string) {
  const url = new URL(request.url)
  if (url.pathname === pathname) return NextResponse.next()
  url.pathname = pathname
  return NextResponse.rewrite(url)
}

/**
 * Decides what a file link serves. Share links work with or without a
 * trailing slash and are never redirected, since Discord drops embeds behind
 * redirects.
 *
 * - People get the file page; video players asking for media get the bytes.
 * - Link-preview bots get the file page and its embed tags when the uploader
 *   has rich embeds on. With them off, bots get the media itself: images as
 *   their fast preview, anything else as the original.
 * - /raw, /direct and /preview.webp are served by their own routes.
 */
export async function routeFileRequest(
  request: NextRequest
): Promise<NextResponse | null> {
  const match = request.nextUrl.pathname.match(FILE_PATH)
  if (!match) return null

  const [, userUrlId, filename, suffix] = match
  const base = `/${userUrlId}/${filename}`

  if (suffix) return rewrite(request, `${base}/${suffix}`)

  const page = `${base}/`
  const userAgent = request.headers.get('user-agent') || ''

  if (!isBotRequest(userAgent)) {
    const extension = filename.split('.').pop()?.toLowerCase() ?? ''
    const accept = request.headers.get('accept') || ''
    const wantsMedia =
      request.headers.has('range') ||
      (accept !== '' && !accept.includes('text/html'))
    if (VIDEO_EXTENSIONS.includes(extension) && wantsMedia) {
      return rewrite(request, `${base}/raw`)
    }
    return rewrite(request, page)
  }

  const file = await lookup(`/${decode(userUrlId)}/${decode(filename)}`)
  if (file.richEmbeds || !file.mimeType) return rewrite(request, page)

  return rewrite(
    request,
    isPreviewable(file.mimeType) ? `${base}/preview.webp` : `${base}/raw`
  )
}
