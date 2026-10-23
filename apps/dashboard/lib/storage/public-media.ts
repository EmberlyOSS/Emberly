/**
 * Public profile media (avatars, banners) and the site favicon.
 *
 * These are always served through Emberly (/api/avatars/…, /api/banners/…,
 * /api/favicon) by streaming from the storage provider, never by redirecting
 * to the storage endpoint: the bucket is private, and storage hostnames must
 * not leak to clients. The database stores the Emberly path with a ?v=
 * version, because re-uploads reuse the same filename.
 */
import { join } from 'path'

import { getStorageProvider } from '@/lib/storage'

export type MediaKind = 'avatars' | 'banners'

const SAFE_FILENAME = /^[A-Za-z0-9_-]+\.(jpe?g|png|gif|webp)$/i

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

export function isSafeMediaFilename(filename: string): boolean {
  return SAFE_FILENAME.test(filename)
}

/** Storage path for a media file (works for both S3 and local providers). */
export function mediaStoragePath(kind: MediaKind, filename: string): string {
  return join('uploads', kind, filename)
}

/** The URL to store in the database for a freshly uploaded media file. */
export function mediaPublicUrl(kind: MediaKind, filename: string): string {
  return `/api/${kind}/${filename}?v=${Date.now()}`
}

/**
 * Storage path of the file a stored media URL points at, or null when the URL
 * isn't one of ours (an external image such as an OAuth avatar).
 * Also understands the legacy /api/profile/banner/ form.
 */
export function storagePathFromMediaUrl(
  url: string | null | undefined,
  kind: MediaKind
): string | null {
  if (!url) return null
  const path = url.split('?')[0]
  const prefixes =
    kind === 'banners'
      ? ['/api/banners/', '/api/profile/banner/']
      : ['/api/avatars/']
  if (!prefixes.some((p) => path.startsWith(p))) return null
  const filename = path.split('/').pop() ?? ''
  return isSafeMediaFilename(filename) ? mediaStoragePath(kind, filename) : null
}

/** Stream a stored image back to the client. */
export async function serveStoredImage(
  storagePath: string,
  filename: string,
  extraHeaders: Record<string, string> = {}
): Promise<Response> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  try {
    const provider = await getStorageProvider()
    const stream = await provider.getFileStream(storagePath)
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        // URLs are versioned (?v=…) on upload, so a day of caching is safe
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        ...extraHeaders,
      },
    })
  } catch (error) {
    const { name, code } = (error ?? {}) as { name?: string; code?: string }
    const missing = [name, code].some(
      (v) => v === 'NoSuchKey' || v === 'NotFound' || v === 'ENOENT'
    )
    return new Response(null, {
      status: missing ? 404 : 502,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }
}
