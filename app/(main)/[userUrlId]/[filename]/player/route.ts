import { type NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { checkFileAccess } from '@/packages/lib/files/access'
import { buildRawUrl, findFileByUrlPath } from '@/packages/lib/files/lookup'

export const dynamic = 'force-dynamic'

/**
 * Minimal HTML player page used as the Twitter `player` card iframe URL.
 * Returns a full HTML document containing only a <video> element so Twitter,
 * Discord and other platforms can embed an interactive player without loading
 * the full Emberly UI.
 *
 * Access control matches the main file page:
 * - Private files → 403 (Twitter scraper can't auth so private videos won't embed)
 * - Password-protected → pass ?password= in query string (Twitter passes it through)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userUrlId: string; filename: string }> },
) {
  const { userUrlId, filename } = await params
  const urlPath = `/${userUrlId}/${filename}`
  const { searchParams } = request.nextUrl
  const password = searchParams.get('password') ?? undefined

  // Fetch file record (handles space→dash fallback automatically)
  const file = await findFileByUrlPath(userUrlId, filename, {
    select: { name: true, mimeType: true, visibility: true, password: true, userId: true },
  })

  if (!file || !file.mimeType.startsWith('video/')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const session = await getServerSession(authOptions)
  const deny = await checkFileAccess(file, { userId: (session?.user as { id?: string })?.id, providedPassword: password })
  if (deny) return new NextResponse(deny.status === 404 ? 'Forbidden' : 'Unauthorized', { status: deny.status })

  const rawUrl = buildRawUrl(urlPath, password)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(file.name)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #0a0a0a; overflow: hidden; }
    video { display: block; width: 100%; height: 100%; object-fit: contain; }
  </style>
</head>
<body>
  <video
    src="${escAttr(rawUrl)}"
    controls
    autoplay
    muted
    playsinline
    preload="metadata"
  ></video>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

/** Escape HTML special chars to prevent XSS in text content. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Escape HTML attribute values. */
function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
