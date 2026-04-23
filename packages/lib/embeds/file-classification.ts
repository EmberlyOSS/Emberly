import {
  AUDIO_FILE_TYPES,
  CODE_FILE_TYPES,
  TEXT_FILE_TYPES,
  VIDEO_FILE_TYPES,
} from '@/packages/components/file/protected/mime-types'

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.apple.pages',
  'application/vnd.apple.keynote',
  'application/vnd.apple.numbers',
])

const MUSIC_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
  'audio/opus',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
])

const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/apng',
  'image/avif',
  'image/heic',
  'image/heif',
])

// Convert arrays to Sets for O(1) lookup instead of O(n)
const VIDEO_MIME_TYPES = new Set(VIDEO_FILE_TYPES)
const AUDIO_MIME_TYPES = new Set(AUDIO_FILE_TYPES)
const TEXT_MIME_TYPES = new Set(TEXT_FILE_TYPES)

export interface FileClassification {
  isImage: boolean
  isVideo: boolean
  isAudio: boolean
  isDocument: boolean
  isCode: boolean
  isText: boolean
  isMusic: boolean
}

export function isImage(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.has(mimeType)
}

export function isVideo(mimeType: string): boolean {
  return VIDEO_MIME_TYPES.has(mimeType)
}

export function isAudio(mimeType: string): boolean {
  return AUDIO_MIME_TYPES.has(mimeType)
}

export function isDocument(mimeType: string): boolean {
  return (
    DOCUMENT_MIME_TYPES.has(mimeType) ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('msword')
  )
}

export function isCode(mimeType: string): boolean {
  return Boolean(CODE_FILE_TYPES[mimeType])
}

export function isText(mimeType: string): boolean {
  return (
    TEXT_MIME_TYPES.has(mimeType) ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/json'
  )
}

export function isMusic(mimeType: string): boolean {
  return MUSIC_MIME_TYPES.has(mimeType)
}

export function classifyMimeType(mimeType: string | undefined | null): FileClassification {
  const safeMimeType = (mimeType || 'application/octet-stream')
    .toLowerCase()
    .split(';')[0]
    .trim()
  return {
    isImage: isImage(safeMimeType),
    isVideo: isVideo(safeMimeType),
    isAudio: isAudio(safeMimeType),
    isDocument: isDocument(safeMimeType),
    isCode: isCode(safeMimeType),
    isText: isText(safeMimeType),
    isMusic: isMusic(safeMimeType),
  }
}
