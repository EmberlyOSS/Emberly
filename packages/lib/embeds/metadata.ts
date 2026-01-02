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
  enableRich?: boolean
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
  enableRich = true,
}: BuildMetadataOptions): Promise<Metadata> {
  // Validate required inputs
  if (!baseUrl || !fileUrlPath || !rawUrl || !fileName || !fileId) {
    return buildMinimalMetadata({ fileName: fileName || 'Emberly file', baseUrl })
  }

  let metadataBase: URL
  try {
    metadataBase = new URL(baseUrl)
  } catch {
    return buildMinimalMetadata({ fileName, baseUrl })
  }

  const classification = classifyMimeType(mimeType)
  const fileUrl = new URL(fileUrlPath, baseUrl).toString()
  const formattedSize = formatFileSize(size)

  const baseTitle = fileName
  // Only include rich description if enabled
  const baseDescription = enableRich
    ? getFileDescription({
        size: formattedSize,
        uploaderName,
        uploadedAt,
      })
    : `${formattedSize} file shared via Emberly`

  const uploadDate = uploadedAt.toISOString()

  // Build thumbnail/preview URL
  // For images, use the raw URL to show full quality image
  // For videos, use the thumbnail endpoint/poster
  let imageUrl: string | undefined
  try {
    if (classification.isImage) {
      imageUrl = rawUrl
    } else if (classification.isVideo) {
      imageUrl = new URL(`/api/files/${fileId}/thumbnail`, baseUrl).toString()
    } else {
      // For other file types, try to get a generic preview
      imageUrl = new URL(`/api/files/${fileId}/thumbnail`, baseUrl).toString()
    }
  } catch (error) {
    console.error('Failed to generate preview URL:', error)
    imageUrl = new URL('/api/og', baseUrl).toString()
  }

  // Build video URL for Discord/social embeds
  let videoUrl: string | undefined
  if (classification.isVideo) {
    // Default to rawUrl
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
      // Fallback to rawUrl which is already set
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
      // Only set siteName if Rich Embeds are enabled, OR if we want to enforce it.
      // If disabled, user likely wants a cleaner look, but missing siteName can affect embed rendering.
      // However, we'll respect the enableRich flag for branding.
      siteName: enableRich ? 'Emberly' : undefined,
      locale: 'en_US',
      type: getOpenGraphType(classification),
      images: imageUrl ? [
        {
          url: imageUrl,
          width: classification.isVideo ? 1280 : undefined,
          height: classification.isVideo ? 720 : undefined,
          alt: classification.isImage ? 'Preview image' : 'File preview',
        }
      ] : undefined,
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
      images: imageUrl ? [imageUrl] : undefined,
    },
    other: {
      'theme-color': '#F97316',
      'article:published_time': uploadDate,
      'al:ios:url': rawUrl,
      'al:android:url': rawUrl,
    },
  }

  return metadata
}

function getOpenGraphType(classification: ReturnType<typeof classifyMimeType>) {
  if (classification.isVideo) return 'video.other'
  if (classification.isMusic) return 'music.song'
  // Use 'website' instead of 'article' for images and others to ensure better embedding
  return 'website'
}



export function buildMinimalMetadata(options: { fileName: string; baseUrl?: string }): Metadata {
  const { fileName, baseUrl } = options
  return {
    title: fileName,
    description: 'Shared via Emberly',
    openGraph: {
      title: fileName,
      description: 'Shared via Emberly',
      type: 'website',
      siteName: 'Emberly',
      images: baseUrl ? [{
        url: new URL('/api/og', baseUrl).toString(),
        width: 1200,
        height: 630,
        alt: 'Emberly',
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: fileName,
      description: 'Shared via Emberly',
      images: baseUrl ? [new URL('/api/og', baseUrl).toString()] : undefined,
    },
    other: {
      'theme-color': '#F97316',
    },
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

