export const PREVIEW_MAX_EDGE = 1920
export const PREVIEW_TYPE = 'image/webp'

const PREVIEWABLE = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/tiff',
  'image/bmp',
  'image/svg+xml',
])

export const baseMime = (mimeType: string) =>
  mimeType.toLowerCase().split(';')[0].trim()

export function isPreviewable(mimeType: string) {
  return PREVIEWABLE.has(baseMime(mimeType))
}

export function previewSize(width: number, height: number) {
  const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}
