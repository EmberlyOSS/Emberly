import { getBranding } from '@/lib/branding'
import { appUrl } from '@/lib/config/env'
import type { Metadata } from 'next'

import { formatFileSize } from '@/lib/utils'
import { getFileDescription } from '@/lib/utils/metadata'

import { classifyMimeType } from './file-classification'
import {
  PREVIEW_TYPE,
  baseMime,
  isPreviewable,
  previewSize,
} from './preview-rules'

interface BuildMetadataOptions {
  baseUrl: string
  fileUrlPath: string
  rawUrl: string
  fileName: string
  mimeType: string
  size: number
  width?: number | null
  height?: number | null
  uploadedAt: Date
  uploaderName: string
}

export interface EmbedImage {
  url: string
  secureUrl: string
  type: string
  width?: number
  height?: number
}

export function embedImageFor(options: {
  baseUrl: string
  fileUrlPath: string
  rawUrl: string
  mimeType: string
  width?: number | null
  height?: number | null
}): EmbedImage {
  const { baseUrl, fileUrlPath, rawUrl, mimeType, width, height } = options
  const known = !!width && !!height

  if (isPreviewable(mimeType)) {
    const url = new URL(`${fileUrlPath}/preview.webp`, baseUrl).toString()
    return {
      url,
      secureUrl: url,
      type: PREVIEW_TYPE,
      ...(known ? previewSize(width!, height!) : {}),
    }
  }

  return {
    url: rawUrl,
    secureUrl: rawUrl,
    type: baseMime(mimeType),
    ...(known ? { width: width!, height: height! } : {}),
  }
}

export async function buildRichMetadata({
  baseUrl,
  fileUrlPath,
  rawUrl,
  fileName,
  mimeType,
  size,
  width,
  height,
  uploadedAt,
  uploaderName,
}: BuildMetadataOptions): Promise<Metadata> {
  const { embedName: brand } = await getBranding()
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
  let twitterCard: string = 'summary_large_image'
  let twitterPlayer:
    | { playerUrl: string; streamUrl: string; width: number; height: number }
    | undefined

  if (classification.isVideo) {
    ogType = 'video.other'
    openGraphVideos = [
      {
        url: rawUrl,
        secureUrl: rawUrl,
        type: mimeType || 'video/mp4',
        width: 1280,
        height: 720,
      },
    ]
    openGraphImages = [
      {
        url: ogImageUrl,
        alt: fileName,
        width: 1200,
        height: 630,
      },
    ]
    twitterCard = 'player'
    const playerUrl = new URL(`${fileUrlPath}/player`, baseUrl).toString()
    twitterPlayer = {
      playerUrl,
      streamUrl: rawUrl,
      width: 1280,
      height: 720,
    }
  } else if (classification.isImage) {
    ogType = 'website'
    openGraphImages = [
      {
        ...embedImageFor({
          baseUrl,
          fileUrlPath,
          rawUrl,
          mimeType,
          width,
          height,
        }),
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
    openGraphImages = [
      {
        url: ogImageUrl,
        alt: `${fileName} — shared via ${brand}`,
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
      siteName: brand,
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

export function buildMinimalMetadata(
  fileName: string,
  brand = 'Emberly'
): Metadata {
  return {
    title: fileName,
    description: `Shared via ${brand}`,
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

export function buildDirectMediaMetadata(options: {
  fileName: string
  rawUrl: string
  mimeType: string
  brand?: string
  image?: EmbedImage
}): Metadata {
  const { fileName, rawUrl, mimeType, brand = 'Emberly', image } = options
  const normalizedMime = mimeType.toLowerCase().split(';')[0].trim()
  const isImage = normalizedMime.startsWith('image/')
  const isVideo = normalizedMime.startsWith('video/')
  const isAudio = normalizedMime.startsWith('audio/')

  if (!isImage && !isVideo && !isAudio) {
    return buildMinimalMetadata(fileName, brand)
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
    description: `Shared via ${brand}`,
    openGraph: {
      title: fileName,
      description: `Shared via ${brand}`,
      type: isVideo ? ('video.other' as any) : 'website',
      images: isImage
        ? [{ ...(image ?? { url: rawUrl }), alt: fileName }]
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
          description: `Shared via ${brand}`,
          images: [image?.url ?? rawUrl],
        }
      : {
          card: 'summary',
          title: fileName,
          description: `Shared via ${brand}`,
        },
    other,
  }
}

export async function getBaseUrl(): Promise<string> {
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const host = headersList.get('host')
    if (host) {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      return `${protocol}://${host}`
    }
  } catch {}
  return appUrl()
}

export async function buildSiteMetadata(overrides?: {
  title?: string
  description?: string
}): Promise<Metadata> {
  const { getConfig } = await import('@/lib/config')
  const config = await getConfig()
  const baseUrl = await getBaseUrl()

  const siteName = config.settings.general.siteName || 'Emberly'
  const title = overrides?.title || `${siteName} | ${SITE_TAGLINE}`
  const description =
    overrides?.description ||
    config.settings.general.metaDescription ||
    SITE_DESCRIPTION

  const themeColor = config.settings.appearance.customColors?.primary
    ? `hsl(${config.settings.appearance.customColors.primary})`
    : '#F97316'

  return {
    metadataBase: new URL(baseUrl),
    title: { absolute: title },
    description,
    keywords: SITE_KEYWORDS,
    authors: [{ name: siteName, url: baseUrl }],
    creator: siteName,
    publisher: siteName,
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
      images: [SITE_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ ...SITE_IMAGE, url: '/twitter-image.png' }],
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

const SITE_TAGLINE = 'Share Files. Build Together.'

const SITE_IMAGE = {
  url: '/opengraph-image.png',
  width: 1200,
  height: 630,
  alt: 'Emberly — open-source file sharing and team collaboration',
}

const SITE_DESCRIPTION =
  'Emberly is a self-hostable platform for file sharing, URL shortening, and talent discovery. Fast, private, and developer-friendly — with custom domains, expiring links, password protection, and squad (team) collaboration.'

const SITE_KEYWORDS = [
  'file sharing',
  'file upload',
  'url shortener',
  'link shortener',
  'short url',
  'custom domain',
  'expiring links',
  'password protected files',
  'talent discovery',
  'developer portfolio',
  'squad collaboration',
  'team file sharing',
  'nexium',
  'self-hosted',
  'self hosted',
  'privacy focused',
  'developer tools',
  's3 storage',
  'cdn file hosting',
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
