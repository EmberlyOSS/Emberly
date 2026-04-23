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
 *
 * Strategy per type:
 * - Images  → og:image = raw URL (Discord/Twitter display the actual image)
 * - Videos  → og:video = raw URL for inline playback (Discord/Telegram/Slack);
 *              og:image = opengraph-image URL as poster thumbnail;
 *              twitter:player = /player iframe for Twitter
 * - Audio   → og:audio = raw URL; og:image = opengraph-image URL
 * - Other   → og:image = opengraph-image branded card
 *
 * Twitter `player` card requires a dedicated HTML iframe page at /player and
 * HTTPS with a whitelisted domain. For development/unwhitelisted domains it
 * silently degrades — Twitter will fall back to summary_large_image.
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
  const ogImageUrl = new URL(
    `${fileUrlPath}/opengraph-image`,
    baseUrl
  ).toString()
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

  let ogType = 'website'
  let openGraphImages: any[] | undefined
  let openGraphVideos: any[] | undefined
  let openGraphAudio: any[] | undefined
  // twitter:player card requires an HTML iframe page + domain whitelisting by Twitter.
  // We point to /player which is a minimal iframe-compatible video page.
  // On unwhitelisted domains Twitter silently degrades to summary_large_image.
  let twitterCard: string = 'summary_large_image'
  let twitterPlayer:
    | { playerUrl: string; streamUrl: string; width: number; height: number }
    | undefined

  if (classification.isVideo) {
    ogType = 'video.other'
    // og:video for Discord/Telegram/Slack inline playback.
    // Do NOT also set other['og:video'] — that creates duplicate tags that confuse crawlers.
    openGraphVideos = [
      {
        url: rawUrl,
        secureUrl: rawUrl,
        type: mimeType || 'video/mp4',
        width: 1280,
        height: 720,
      },
    ]
    // Poster thumbnail — Discord shows this as the card thumbnail before and during playback.
    openGraphImages = [
      {
        url: ogImageUrl,
        alt: fileName,
        width: 1200,
        height: 630,
      },
    ]
    // Twitter player card: /player is a minimal HTML iframe page with just the <video> element.
    twitterCard = 'player'
    const playerUrl = new URL(`${fileUrlPath}/player`, baseUrl).toString()
    twitterPlayer = {
      playerUrl,
      streamUrl: rawUrl,
      width: 1280,
      height: 720,
    }
  } else if (classification.isImage) {
    // Use the raw image URL directly — Discord and Twitter render the actual image
    // in the embed rather than a generic branded card, which is far better UX.
    ogType = 'website'
    openGraphImages = [
      {
        url: rawUrl,
        alt: fileName,
      },
    ]
    twitterCard = 'summary_large_image'
  } else if (classification.isAudio || classification.isMusic) {
    ogType = classification.isMusic ? 'music.song' : 'website'
    openGraphAudio = [
      {
        url: rawUrl,
        type: mimeType || 'audio/mpeg',
      },
    ]
    // Cover art card so platforms that don't render audio still show something meaningful.
    openGraphImages = [
      {
        url: ogImageUrl,
        alt: fileName,
        width: 1200,
        height: 630,
      },
    ]
    twitterCard = 'summary_large_image'
  } else {
    // Generic file — branded preview card
    openGraphImages = [
      {
        url: ogImageUrl,
        alt: `${fileName} — shared via Emberly`,
        width: 1200,
        height: 630,
      },
    ]
    twitterCard = 'summary_large_image'
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
      type: ogType as any,
      images: openGraphImages,
      videos: openGraphVideos,
      audio: openGraphAudio,
    },
    twitter: twitterPlayer
      ? {
          card: twitterCard as any,
          title,
          description,
          players: [twitterPlayer],
        }
      : {
          card: twitterCard as any,
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
 * Also adds robots: noindex to prevent crawlers from indexing or embedding this page.
 * This ensures Discord/Twitter show plain links without any embed preview.
 */
export function buildMinimalMetadata(
  fileName: string,
  _rawUrl?: string
): Metadata {
  return {
    title: fileName,
    description: 'Shared via Emberly',
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
    other: {
      googlebot: 'noindex, nofollow',
      'googlebot-news': 'nosnippet',
    },
  }
}

/**
 * Build lightweight metadata that mirrors "raw endpoint" behavior for media.
 * Used when rich embeds are disabled so platforms can still inline media
 * without branded Open Graph cards.
 */
export function buildDirectMediaMetadata(options: {
  fileName: string
  rawUrl: string
  mimeType: string
}): Metadata {
  const { fileName, rawUrl, mimeType } = options
  const normalizedMime = mimeType.toLowerCase().split(';')[0].trim()
  const isImage = normalizedMime.startsWith('image/')
  const isVideo = normalizedMime.startsWith('video/')
  const isAudio = normalizedMime.startsWith('audio/')

  if (!isImage && !isVideo && !isAudio) {
    return buildMinimalMetadata(fileName)
  }

  const other: Record<string, string> = {}
  if (isVideo) {
    other['og:video'] = rawUrl
    other['og:video:secure_url'] = rawUrl
    other['og:video:type'] = normalizedMime || 'video/mp4'
  } else if (isAudio) {
    other['og:audio'] = rawUrl
    other['og:audio:type'] = normalizedMime || 'audio/mpeg'
  }

  return {
    title: fileName,
    description: 'Shared via Emberly',
    openGraph: {
      title: fileName,
      description: 'Shared via Emberly',
      type: isVideo ? ('video.other' as any) : 'website',
      images: isImage
        ? [
            {
              url: rawUrl,
              alt: fileName,
            },
          ]
        : undefined,
      videos: isVideo
        ? [
            {
              url: rawUrl,
              secureUrl: rawUrl,
              type: normalizedMime || 'video/mp4',
              width: 1280,
              height: 720,
            },
          ]
        : undefined,
      audio: isAudio
        ? [
            {
              url: rawUrl,
              type: normalizedMime || 'audio/mpeg',
            },
          ]
        : undefined,
    },
    twitter: isImage
      ? {
          card: 'summary_large_image',
          title: fileName,
          description: 'Shared via Emberly',
          images: [rawUrl],
        }
      : {
          card: 'summary',
          title: fileName,
          description: 'Shared via Emberly',
        },
    other,
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
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  )
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
  const description = overrides?.description || SITE_DESCRIPTION

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
    keywords: SITE_KEYWORDS,
    authors: [{ name: 'Emberly', url: baseUrl }],
    creator: 'Emberly',
    publisher: 'Emberly',
    category: 'technology',
    classification: 'Software / Developer Tools',
    referrer: 'origin-when-cross-origin',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: baseUrl,
    },
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
      site: '@embrlyca',
      creator: '@embrlyca',
    },
    other: {
      'theme-color': themeColor,
      'msapplication-TileColor': '#09090b',
      'msapplication-config': '/browserconfig.xml',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'apple-mobile-web-app-title': siteName,
      'format-detection': 'telephone=no',
      'X-UA-Compatible': 'IE=edge',
    },
    manifest: '/manifest.webmanifest',
  }
}

const SITE_DESCRIPTION =
  'Emberly is an open-source platform for file sharing, URL shortening, and talent discovery. Fast, private, and developer-friendly — with custom domains, expiring links, password protection, and squad (team) collaboration.'

const SITE_KEYWORDS = [
  // Core product
  'file sharing',
  'file upload',
  'url shortener',
  'link shortener',
  'short url',
  'custom domain',
  'expiring links',
  'password protected files',
  // Team / talent
  'talent discovery',
  'developer portfolio',
  'squad collaboration',
  'team file sharing',
  'nexium',
  // Tech descriptors
  'open source',
  'self hosted',
  'privacy focused',
  'developer tools',
  's3 storage',
  'cdn file hosting',
  // Brand + alternatives
  'emberly',
  'embrly',
  'file manager',
  'link manager',
  'cdn hosting',
  'sharex host',
]

export function buildPageMetadata(options: {
  title: string
  description?: string
}): Metadata {
  return {
    title: options.title,
    description: options.description || SITE_DESCRIPTION,
  }
}
