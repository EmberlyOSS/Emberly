import type { Metadata } from 'next'

import { formatFileSize } from '@/packages/lib/utils'
import { getFileDescription } from '@/packages/lib/utils/metadata'

import { classifyMimeType } from './file-classification'

// ============================================================================
// Types
// ============================================================================

interface BuildMetadataOptions {
  baseUrl: string
  fileUrlPath: string
  rawUrl: string
  fileName: string
  mimeType: string
  size: number
  uploadedAt: Date
  uploaderName: string
}

// ============================================================================
// Main Metadata Builders
// ============================================================================

/**
 * Build rich metadata for file embeds with proper strategy per file type.
 * - Images: Include branded preview URL in og:image
 * - Videos: Use raw URL for playable embed
 * - Audio: Use raw URL for player
 * - Other: Include branded preview URL
 */
export async function buildRichMetadata({
  baseUrl,
  fileUrlPath,
  rawUrl,
  fileName,
  mimeType,
  size,
  uploadedAt,
  uploaderName,
}: BuildMetadataOptions): Promise<Metadata> {
  const classification = classifyMimeType(mimeType)
  const fileUrl = new URL(fileUrlPath, baseUrl).toString()
  const uploadDate = uploadedAt.toISOString()
  const formattedSize = formatFileSize(size)

  const title = fileName
  const description = getFileDescription({
    size: formattedSize,
    uploaderName,
    uploadedAt,
  })

  const other: Record<string, string> = {
    'theme-color': '#F97316',
    'article:published_time': uploadDate,
    'al:ios:url': rawUrl,
    'al:android:url': rawUrl,
  }

  // Determine OG type and media strategy based on classification
  let ogType = 'website'
  let openGraphImages: any = undefined
  let openGraphVideos: any = undefined
  let openGraphAudio: any = undefined
  let twitterCard = 'summary'
  let twitterPlayers: any = undefined

  if (classification.isVideo) {
    ogType = 'video.other'
    openGraphVideos = [{
      url: rawUrl,
      secureUrl: rawUrl,
      type: mimeType || 'video/mp4',
      width: 1280,
      height: 720,
    }]
    twitterCard = 'player'
    twitterPlayers = [{
      playerUrl: rawUrl,
      streamUrl: rawUrl,
      width: 1280,
      height: 720,
    }]
    // Add explicit video meta tags for Discord compatibility
    other['og:video'] = rawUrl
    other['og:video:secure_url'] = rawUrl
    other['og:video:type'] = mimeType || 'video/mp4'
    other['og:video:width'] = '1280'
    other['og:video:height'] = '720'
  } else if (classification.isAudio || classification.isMusic) {
    ogType = classification.isMusic ? 'music.song' : 'website'
    openGraphAudio = [{
      url: rawUrl,
      type: mimeType || 'audio/mpeg',
    }]
  } else if (classification.isImage) {
    // For images with rich embeds, generate branded preview URL
    // Use the opengraph-image route (Next.js will handle it)
    const previewUrl = new URL(`${fileUrlPath}/opengraph-image`, baseUrl).toString()
    openGraphImages = [{
      url: previewUrl,
      alt: `Preview of ${fileName}`,
      width: 1200,
      height: 630,
    }]
  } else {
    // For other files with rich embeds, use branded preview
    const previewUrl = new URL(`${fileUrlPath}/opengraph-image`, baseUrl).toString()
    openGraphImages = [{
      url: previewUrl,
      alt: `Preview of ${fileName}`,
      width: 1200,
      height: 630,
    }]
  }

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      url: fileUrl,
      siteName: 'Emberly',
      locale: 'en_US',
      type: ogType,
      images: openGraphImages,
      videos: openGraphVideos,
      audio: openGraphAudio,
    },
    twitter: twitterPlayers
      ? {
          card: twitterCard,
          title,
          description,
          players: twitterPlayers,
        }
      : {
          card: 'summary',
          title,
          description,
          images: openGraphImages?.map((img: any) => img.url),
        },
    other,
  }
}

/**
 * Build minimal metadata for files when rich embeds are disabled or inaccessible.
 * Returns NO embed metadata - no og:image, no twitter cards, no preview cards.
 * This ensures Discord/Twitter show plain links without any embed preview.
 */
export function buildMinimalMetadata(fileName: string, rawUrl?: string): Metadata {
  return {
    title: fileName,
    description: 'Shared via Emberly',
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