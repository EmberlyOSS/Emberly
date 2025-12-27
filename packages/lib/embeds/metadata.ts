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
  fileId?: string // Optional file ID for thumbnail URL
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
  // Bail out early if critical inputs are missing to avoid Next metadata serialization crashes.
  if (!baseUrl || !fileUrlPath || !rawUrl || !fileName) {
    return buildMinimalMetadata(fileName || 'Emberly file')
  }

  const safeBaseUrl = String(baseUrl)
  const safeFileUrlPath = String(fileUrlPath)
  const safeRawUrl = String(rawUrl)
  const safeMimeType = mimeType || 'application/octet-stream'
  const safeSize = typeof size === 'number' && Number.isFinite(size) ? size : 0
  const safeFileId = fileId ? String(fileId) : undefined
  const safeFilePath = filePath ? String(filePath) : ''

  let metadataBase: URL | undefined
  try {
    metadataBase = new URL(safeBaseUrl)
  } catch (err) {
    console.error('Invalid baseUrl for metadata, falling back to minimal metadata', err)
    return buildMinimalMetadata(fileName)
  }

  const classification = classifyMimeType(mimeType)
  const fileUrl = `${safeBaseUrl}${safeFileUrlPath}`
  const formattedSize = formatFileSize(safeSize)
  const uploadDate = uploadedAt.toISOString()

  const baseTitle = fileName
  const baseDescription = getFileDescription({
    size: formattedSize,
    uploaderName,
    uploadedAt,
  })

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
        safeFileId
      ),
      videos: await buildOpenGraphVideos(
        classification.isVideo,
        safeRawUrl,
        safeMimeType,
        safeFilePath
      ),
      audio: buildOpenGraphAudio(classification.isAudio, safeRawUrl, safeMimeType),
    },
    twitter: buildTwitterMetadata(classification, {
      title: baseTitle,
      description: baseDescription,
      rawUrl: safeRawUrl,
      fileUrl,
      baseUrl: safeBaseUrl,
      fileId: safeFileId,
    }),
    other: buildOtherMetadata({
      uploadDate,
      description: baseDescription,
      rawUrl: safeRawUrl,
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

function buildOpenGraphImages(
  isImageFile: boolean,
  rawUrl: string,
  mimeType: string,
  baseUrl: string,
  fileId?: string
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

async function buildOpenGraphVideos(
  isVideoFile: boolean,
  rawUrl: string,
  mimeType: string,
  filePath: string
) {
  if (!isVideoFile) return undefined
  if (!rawUrl || !filePath) return undefined

  let videoUrl = rawUrl
  try {
    const storageProvider = await getStorageProvider()
    if (storageProvider && typeof storageProvider.getFileUrl === 'function') {
      const providerUrl = await storageProvider.getFileUrl(filePath)
      if (providerUrl) {
        videoUrl = providerUrl
      }
    }
  } catch (error) {
    // Fall back to rawUrl if storage provider is unavailable
    console.error('Failed to get video URL from storage provider:', error)
  }

  if (!videoUrl) return undefined

  const safeUrl = String(videoUrl)
  const safeMime = mimeType || 'video/mp4'

  return [
    {
      url: safeUrl,
      type: safeMime,
      secureUrl: safeUrl,
    },
  ]
}

function buildOpenGraphAudio(
  isAudioFile: boolean,
  rawUrl: string,
  mimeType: string
) {
  if (!isAudioFile) return undefined

  return [
    {
      url: rawUrl,
      type: mimeType,
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
}

function buildTwitterMetadata(
  classification: ReturnType<typeof classifyMimeType>,
  { title, description, rawUrl, fileUrl, baseUrl, fileId }: TwitterMetadataInput
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
    if (!fileUrl || !rawUrl) {
      // Fallback to summary card if URLs are missing
      return {
        card: 'summary' as const,
        title,
        description,
      }
    }

    return {
      card: 'player' as const,
      title,
      description,
      players: [
        {
          playerUrl: String(fileUrl),
          streamUrl: String(rawUrl),
          width: 1280,
          height: 720,
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
    'theme-color': '#F97316', // Ember orange
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
 * Uses getConfig() to pull settings from the database.
 */
export async function buildSiteMetadata(overrides?: {
  title?: string
  description?: string
}): Promise<Metadata> {
  const { getConfig } = await import('@/packages/lib/config')
  const config = await getConfig()
  const baseUrl = await getBaseUrl()

  // Site name could be made configurable in the future via config
  const siteName = 'Emberly'
  const title = overrides?.title || siteName
  const description = overrides?.description || 'Emberly focuses on a simple, predictable file hosting experience with features that matter: expirations, custom domains, usage controls, and privacy-first defaults.'
  const bannerUrl = `${baseUrl}/banner.png`

  // Use theme color from config's custom colors if available, otherwise default
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
      images: [
        {
          url: bannerUrl,
          width: 1200,
          height: 630,
          alt: `${siteName} - Simple, predictable file hosting`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [bannerUrl],
    },
    other: {
      'theme-color': themeColor,
    },
  }
}

/**
 * Build page-specific metadata. OG images are inherited from layout.
 */
export function buildPageMetadata(options: { title: string; description?: string }): Metadata {
  return {
    title: options.title,
    description: options.description || 'Emberly focuses on a simple, predictable file hosting experience with features that matter: expirations, custom domains, usage controls, and privacy-first defaults.',
  }
}

