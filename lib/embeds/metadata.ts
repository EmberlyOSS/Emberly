import type { Metadata } from 'next'

import { getStorageProvider } from '@/lib/storage'
import { formatFileSize } from '@/lib/utils'
import { getFileDescription } from '@/lib/utils/metadata'

import { classifyMimeType } from './file-classification'

/**
 * Get file URL with fallback - primarily uses /raw endpoint, but prepares a fallback URL
 * from the storage provider. If /raw endpoint fails (403, 500, etc.), the fallback can be used.
 * Returns an object with both primary (/raw) and fallback (storage provider) URLs.
 */
async function getFileUrlWithFallbackOption(
  rawUrl: string,
  filePath: string
): Promise<{ primary: string; fallback?: string }> {
  const primary = rawUrl
  let fallback: string | undefined

  // Get fallback URL from storage provider
  try {
    const storageProvider = await getStorageProvider()
    if (storageProvider && typeof storageProvider.getFileUrl === 'function') {
      fallback = await storageProvider.getFileUrl(filePath)
    }
  } catch (error) {
    // If storage provider fails, fallback won't be available
    // This is okay - we'll still use the primary /raw URL
    console.error('Failed to get fallback URL from storage provider:', error)
  }

  // Try to verify if /raw endpoint is accessible
  // Use a very short timeout to avoid blocking metadata generation
  let useFallback = false
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1000) // 1 second timeout

    const response = await fetch(rawUrl, {
      method: 'HEAD',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    // If /raw returns an error status (403, 500, etc.), use fallback if available
    if (!response.ok && fallback) {
      console.warn(
        `/raw endpoint returned ${response.status} for ${rawUrl}, using storage provider fallback`
      )
      useFallback = true
    }
  } catch (error) {
    // If check fails (timeout, network error, etc.), assume /raw will work
    // and use it as primary - the actual request might succeed
    // Only log if it's not a timeout (expected in some cases)
    if (error instanceof Error && error.name !== 'AbortError') {
      console.debug(
        `Could not verify /raw endpoint accessibility: ${error.message}`
      )
    }
  }

  // Return primary and fallback - if /raw failed verification, use storage provider as primary
  if (useFallback && fallback) {
    return { primary: fallback, fallback: rawUrl }
  }

  return { primary, fallback }
}

interface BuildMetadataOptions {
  baseUrl: string
  fileUrlPath: string
  rawUrl: string
  fileName: string
  mimeType: string
  size: number
  uploadedAt: Date
  uploaderName: string
  filePath: string
}

export async function buildRichMetadata({
  baseUrl,
  fileUrlPath,
  rawUrl,
  fileName,
  mimeType,
  size,
  uploadedAt,
  uploaderName,
  filePath,
}: BuildMetadataOptions): Promise<Metadata> {
  const classification = classifyMimeType(mimeType)
  const fileUrl = `${baseUrl}${fileUrlPath}`
  const formattedSize = formatFileSize(size)
  const uploadDate = uploadedAt.toISOString()

  const baseTitle = fileName
  const baseDescription = getFileDescription({
    size: formattedSize,
    uploaderName,
    uploadedAt,
  })

  // Get URLs with fallback options for media files
  const imageUrl = classification.isImage
    ? await getFileUrlWithFallbackOption(rawUrl, filePath)
    : null
  const videoUrl = classification.isVideo
    ? await getFileUrlWithFallbackOption(rawUrl, filePath)
    : null
  const audioUrl = classification.isAudio
    ? await getFileUrlWithFallbackOption(rawUrl, filePath)
    : null

  const metadata: Metadata = {
    title: baseTitle,
    description: baseDescription,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: baseTitle,
      description: baseDescription,
      url: fileUrl,
      siteName: 'Emberly',
      locale: 'en_US',
      type: getOpenGraphType(classification),
      images: imageUrl
        ? await buildOpenGraphImages(
            classification.isImage,
            imageUrl.primary,
            imageUrl.fallback,
            mimeType
          )
        : undefined,
      videos: videoUrl
        ? await buildOpenGraphVideos(
            classification.isVideo,
            videoUrl.primary,
            videoUrl.fallback,
            mimeType
          )
        : undefined,
      audio: audioUrl
        ? await buildOpenGraphAudio(
            classification.isAudio,
            audioUrl.primary,
            audioUrl.fallback,
            mimeType
          )
        : undefined,
    },
    twitter: buildTwitterMetadata(classification, {
      title: baseTitle,
      description: baseDescription,
      rawUrl: imageUrl?.primary || videoUrl?.primary || rawUrl,
      fileUrl,
    }),
    other: buildOtherMetadata({
      uploadDate,
      description: baseDescription,
      rawUrl: imageUrl?.primary || rawUrl,
      isImage: classification.isImage,
    }),
  }

  return metadata
}

function getOpenGraphType(classification: ReturnType<typeof classifyMimeType>) {
  if (classification.isVideo) return 'video.other'
  if (classification.isMusic) return 'music.song'
  if (
    classification.isImage ||
    classification.isDocument ||
    classification.isCode
  )
    return 'article'
  return 'website'
}

async function buildOpenGraphImages(
  isImageFile: boolean,
  primaryUrl: string,
  fallbackUrl: string | undefined,
  mimeType: string
) {
  if (!isImageFile) return undefined

  // Primary: use /raw endpoint, fallback to storage provider URL if available
  const images = [
    {
      url: primaryUrl,
      alt: 'Preview image',
      type: mimeType,
    },
  ]

  // Add fallback URL as a second image option for crawlers that support multiple images
  // This allows crawlers to try the fallback if the primary fails
  if (fallbackUrl && fallbackUrl !== primaryUrl) {
    images.push({
      url: fallbackUrl,
      alt: 'Preview image (fallback)',
      type: mimeType,
    })
  }

  return images
}

async function buildOpenGraphVideos(
  isVideoFile: boolean,
  primaryUrl: string,
  fallbackUrl: string | undefined,
  mimeType: string
) {
  if (!isVideoFile) return undefined

  // Primary: use /raw endpoint, fallback to storage provider URL if /raw fails
  const url = primaryUrl

  return [
    {
      url,
      type: mimeType,
      // Include fallback as secureUrl
      secureUrl: fallbackUrl || url,
    },
  ]
}

async function buildOpenGraphAudio(
  isAudioFile: boolean,
  primaryUrl: string,
  fallbackUrl: string | undefined,
  mimeType: string
) {
  if (!isAudioFile) return undefined

  // Primary: use /raw endpoint, fallback to storage provider URL if /raw fails
  const url = primaryUrl

  return [
    {
      url,
      type: mimeType,
      // Include fallback if available
      ...(fallbackUrl && { secureUrl: fallbackUrl }),
    },
  ]
}

interface TwitterMetadataInput {
  title: string
  description: string
  rawUrl: string
  fileUrl: string
}

function buildTwitterMetadata(
  classification: ReturnType<typeof classifyMimeType>,
  { title, description, rawUrl, fileUrl }: TwitterMetadataInput
) {
  if (classification.isImage) {
    return {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [rawUrl], // Primary: /raw endpoint
    }
  }

  if (classification.isVideo) {
    return {
      card: 'player' as const,
      title,
      description,
      players: [
        {
          url: fileUrl,
          stream: rawUrl, // Primary: /raw endpoint
        },
      ],
    }
  }

  if (classification.isAudio) {
    return {
      card: 'summary' as const,
      title,
      description,
    }
  }

  if (
    classification.isDocument ||
    classification.isCode ||
    classification.isText
  ) {
    return {
      card: 'summary' as const,
      title,
      description,
    }
  }

  return undefined
}

interface OtherMetadataInput {
  uploadDate: string
  description: string
  rawUrl: string
  isImage: boolean
}

function buildOtherMetadata({
  uploadDate,
  description,
  rawUrl,
  isImage,
}: OtherMetadataInput) {
  const metadata: Record<string, string> = {
    'theme-color': '#3b82f6',
    'article:published_time': uploadDate,
    'og:description': description,
    'al:ios:url': rawUrl,
    'al:android:url': rawUrl,
  }

  if (isImage) {
    metadata['og:image:alt'] = 'Preview image'
  }

  return metadata
}

export function buildMinimalMetadata(fileName: string): Metadata {
  return {
    title: fileName,
    description: '',
  }
}
