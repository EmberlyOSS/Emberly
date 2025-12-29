import type { Metadata } from 'next'

import { getStorageProvider } from '@/packages/lib/storage'
import { formatFileSize } from '@/packages/lib/utils'
import { getFileDescription } from '@/packages/lib/utils/metadata'

import { classifyMimeType } from './file-classification'

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
  fileId?: string
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
  fileId,
}: BuildMetadataOptions): Promise<Metadata> {
  // Validate required inputs
  if (!baseUrl || !fileUrlPath || !rawUrl || !fileName || !fileId) {
    return buildMinimalMetadata(fileName || 'Emberly file')
  }

  let metadataBase: URL
  try {
    metadataBase = new URL(baseUrl)
  } catch {
    return buildMinimalMetadata(fileName)
  }

  const classification = classifyMimeType(mimeType)
  const fileUrl = new URL(fileUrlPath, baseUrl).toString()
  const formattedSize = formatFileSize(size)
  const uploadDate = uploadedAt.toISOString()

  const baseTitle = fileName
  const baseDescription = getFileDescription({
    size: formattedSize,
    uploaderName,
    uploadedAt,
  })

  // Get video URL for embeds (Discord, Twitter, etc.)
  let resolvedVideoUrl: string | undefined
  if (classification.isVideo) {
    resolvedVideoUrl = safeRawUrl
    try {
      const storageProvider = await getStorageProvider()
      if (storageProvider && typeof storageProvider.getFileUrl === 'function') {
        const providerUrl = await storageProvider.getFileUrl(safeFilePath)
        if (providerUrl) {
          resolvedVideoUrl = providerUrl
        }
      }
    } catch (error) {
      console.error('Failed to get video URL from storage provider:', error)
    }
  }

  const metadata: Metadata = {
    title: baseTitle,
    description: baseDescription,
    metadataBase,
    openGraph: {
      title: baseTitle,
      description: baseDescription,
      url: fileUrl,
      siteName: 'Emberly',
      locale: 'en_US',
      type: getOpenGraphType(classification),
      images: buildOpenGraphImages(
        classification.isImage,
        safeRawUrl,
        safeMimeType,
        safeBaseUrl,
        safeFileId,
        classification.isVideo,
        resolvedVideoUrl
      ),
      videos: classification.isVideo && resolvedVideoUrl ? [
        {
          url: resolvedVideoUrl,
          secureUrl: resolvedVideoUrl,
          type: safeMimeType,
          width: 1280,
          height: 720,
        },
      ] : undefined,
      audio: buildOpenGraphAudio(classification.isAudio, safeRawUrl, safeMimeType),
    },
    twitter: {
      card: 'summary_large_image',
      title: baseTitle,
      description: baseDescription,
      rawUrl: safeRawUrl,
      fileUrl,
      baseUrl: safeBaseUrl,
      fileId: safeFileId,
      videoUrl: resolvedVideoUrl,
    }),
    other: buildOtherMetadata({
      uploadDate,
      description: baseDescription,
      rawUrl: safeRawUrl,
      isImage: classification.isImage,
      isVideo: classification.isVideo,
      mimeType: safeMimeType,
      videoUrl: resolvedVideoUrl,
    }),
  }

  return metadata
}

function getOpenGraphType(classification: ReturnType<typeof classifyMimeType>) {
  if (classification.isVideo) return 'video.other'
  if (classification.isMusic) return 'music.song'
  if (classification.isImage || classification.isDocument || classification.isCode) {
    return 'article'
  return 'website'
}

function buildOpenGraphImages(
  isImageFile: boolean,
  rawUrl: string,
  mimeType: string,
  baseUrl: string,
  fileId?: string,
  isVideoFile?: boolean,
  videoUrl?: string
) {
  if (isImageFile && fileId) {
    // Use thumbnail endpoint which doesn't require password auth
    // This allows Discord, Twitter, etc. to fetch the image preview
    const thumbnailUrl = `${baseUrl.replace(/\/$/, '')}/api/files/${fileId}/thumbnail`
    return [
      {
        url: thumbnailUrl,
        alt: 'Preview image',
        type: mimeType,
      },
    ]
  }

  // For video files, we need to provide an image for platforms that don't auto-generate thumbnails
  // Some platforms will use this as the preview image before the video plays
  if (isVideoFile && fileId && baseUrl) {
    // Try to use video thumbnail if available, otherwise fall back to banner
    const thumbnailUrl = `${baseUrl.replace(/\/$/, '')}/api/files/${fileId}/thumbnail`
    return [
      {
        url: thumbnailUrl,
        width: 1280,
        height: 720,
        alt: 'Video preview',
        type: 'image/png',
      },
    ]
  }

  // Fallback to the site banner for non-image files
  // This ensures Discord, Twitter, etc. always have an image to display
  if (baseUrl) {
    const fallbackUrl = `${baseUrl.replace(/\/$/, '')}/banner.png`
    return [
      {
        url: fallbackUrl,
        width: 1200,
        height: 630,
        alt: 'Emberly - Simple, predictable file hosting',
        type: 'image/png',
      },
    ]
  }

  return undefined
}

function buildOpenGraphAudio(
  isAudioFile: boolean,
  rawUrl: string,
  mimeType: string
) {
  return [
    {
      url: thumbnailUrl,
      width: 1280,
      height: 720,
      alt: classification.isImage ? 'Preview image' : 'File preview',
      type: 'image/png',
    },
  ]
}

interface TwitterMetadataInput {
  title: string
  description: string
  rawUrl: string
  fileUrl: string
  baseUrl?: string
  fileId?: string
  videoUrl?: string
}

function buildTwitterMetadata(
  classification: ReturnType<typeof classifyMimeType>,
  { title, description, rawUrl, fileUrl, baseUrl, fileId, videoUrl }: TwitterMetadataInput
) {
  if (classification.isImage) {
    // Use thumbnail endpoint for Twitter cards (doesn't require password auth)
    const imageUrl = baseUrl && fileId
      ? `${baseUrl.replace(/\/$/, '')}/api/files/${fileId}/thumbnail`
      : rawUrl
    return {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [imageUrl],
    }
  }

  if (classification.isVideo) {
    // For video files, use summary_large_image with a thumbnail
    // The player card requires whitelisting from Twitter and doesn't work for most sites
    // Instead, Discord and other platforms use og:video tags (handled in buildOtherMetadata)
    const thumbnailUrl = baseUrl && fileId
      ? `${baseUrl.replace(/\/$/, '')}/api/files/${fileId}/thumbnail`
      : `${baseUrl?.replace(/\/$/, '')}/banner.png`

    return {
      card: 'summary_large_image' as const,
      title,
      description,
      images: thumbnailUrl ? [thumbnailUrl] : undefined,
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
  isVideo?: boolean
  mimeType?: string
  videoUrl?: string
}

function buildOtherMetadata({
  uploadDate,
  description,
  rawUrl,
  isImage,
  isVideo,
  mimeType,
  videoUrl,
}: OtherMetadataInput) {
  const metadata: Record<string, string> = {
    'theme-color': '#F97316', // Ember orange
    'article:published_time': uploadDate,
    'og:description': description,
    'al:ios:url': rawUrl,
    'al:android:url': rawUrl,
  }

  if (isImage) {
    metadata['og:image:alt'] = 'Preview image'
  }

  // Discord requires explicit og:video tags for video embeds
  // These are added via 'other' since Next.js Metadata openGraph.videos
  // doesn't generate the exact format Discord expects
  if (isVideo && videoUrl) {
    metadata['og:video'] = videoUrl
    metadata['og:video:secure_url'] = videoUrl
    metadata['og:video:type'] = mimeType || 'video/mp4'
    metadata['og:video:width'] = '1280'
    metadata['og:video:height'] = '720'
  }

  return metadata
}

export function buildMinimalMetadata(fileName: string): Metadata {
  return {
    title: fileName,
    description: '',
  }
}

/**
 * Get the base URL from headers or environment.
 */
export async function getBaseUrl(): Promise<string> {
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const host = headersList.get('host')
    if (host) {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      return `${protocol}://${host}`
    }
  } catch {
    // headers() not available outside request context
  }
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

/**
 * Build default site-wide metadata with OG banner fallback.
 */
export async function buildSiteMetadata(overrides?: {
  title?: string
  description?: string
}): Promise<Metadata> {
  const { getConfig } = await import('@/packages/lib/config')
  const config = await getConfig()
  const baseUrl = await getBaseUrl()

  const siteName = 'Emberly'
  const title = overrides?.title || siteName
  const description = overrides?.description || 'Emberly focuses on a simple, predictable file hosting experience with features that matter: expirations, custom domains, usage controls, and privacy-first defaults.'

  const themeColor = config.settings.appearance.customColors?.primary
    ? `hsl(${config.settings.appearance.customColors.primary})`
    : '#F97316'

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      url: baseUrl,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    other: {
      'theme-color': themeColor,
    },
  }
}

export function buildPageMetadata(options: { title: string; description?: string }): Metadata {
  return {
    title: options.title,
    description: options.description || 'Emberly focuses on a simple, predictable file hosting experience with features that matter: expirations, custom domains, usage controls, and privacy-first defaults.',
  }
}

