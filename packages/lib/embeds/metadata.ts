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

  // Build thumbnail URL for images and videos
  const thumbnailUrl = new URL(`/api/files/${fileId}/thumbnail`, baseUrl).toString()

  // Build video URL for Discord/social embeds
  let videoUrl: string | undefined
  if (classification.isVideo) {
    videoUrl = rawUrl
    try {
      const storageProvider = await getStorageProvider()
      if (storageProvider?.getFileUrl) {
        const providerUrl = await storageProvider.getFileUrl(filePath)
        if (providerUrl) {
          videoUrl = providerUrl
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
      images: getOpenGraphImages(classification, thumbnailUrl),
      videos: classification.isVideo && videoUrl ? [
        {
          url: videoUrl,
          secureUrl: videoUrl,
          type: mimeType || 'video/mp4',
          width: 1280,
          height: 720,
        },
      ] : undefined,
      audio: classification.isAudio ? [
        {
          url: rawUrl,
          type: mimeType || 'audio/mpeg',
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: baseTitle,
      description: baseDescription,
      images: [thumbnailUrl],
    },
    other: {
      'theme-color': '#F97316',
      'article:published_time': uploadDate,
      'og:description': baseDescription,
      'al:ios:url': rawUrl,
      'al:android:url': rawUrl,
      ...(classification.isVideo && videoUrl && {
        'og:video': videoUrl,
        'og:video:secure_url': videoUrl,
        'og:video:type': mimeType || 'video/mp4',
        'og:video:width': '1280',
        'og:video:height': '720',
      }),
      ...(classification.isImage && {
        'og:image:alt': 'Preview image',
      }),
    },
  }

  return metadata
}

function getOpenGraphType(classification: ReturnType<typeof classifyMimeType>) {
  if (classification.isVideo) return 'video.other'
  if (classification.isMusic) return 'music.song'
  if (classification.isImage || classification.isDocument || classification.isCode) {
    return 'article'
  }
  return 'website'
}

function getOpenGraphImages(
  classification: ReturnType<typeof classifyMimeType>,
  thumbnailUrl: string
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

