import { baseMime } from '@/lib/embeds/preview-rules'

const RASTER_IMAGES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
  'image/vnd.microsoft.icon',
])

/** Image types that can't contain markup or scripts, unlike SVG. */
export function isRasterImage(mimeType: string) {
  return RASTER_IMAGES.has(baseMime(mimeType))
}

/**
 * Headers for any response that serves an uploaded file's bytes. The stored
 * type comes from the uploader, so an SVG or HTML file opened directly would
 * otherwise run its scripts on our origin with the viewer's session.
 */
export function fileSecurityHeaders(mimeType: string): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
  }
  // Browsers refuse to show PDFs in a sandboxed document, and their PDF
  // viewers never run a PDF's scripts on the site's origin
  if (baseMime(mimeType) !== 'application/pdf') {
    headers['Content-Security-Policy'] = 'sandbox'
  }
  return headers
}
