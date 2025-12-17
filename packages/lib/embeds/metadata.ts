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
  // Bail out early if critical inputs are missing to avoid Next metadata serialization crashes.
  if (!baseUrl || !fileUrlPath || !rawUrl || !fileName) {
    return buildMinimalMetadata(fileName || 'Emberly file')
  }

  const safeBaseUrl = String(baseUrl)
  const safeFileUrlPath = String(fileUrlPath)
  const safeRawUrl = String(rawUrl)
  const safeMimeType = mimeType || 'application/octet-stream'
  const safeSize = typeof size === 'number' && Number.isFinite(size) ? size : 0

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
        safeBaseUrl
      ),
      videos: await buildOpenGraphVideos(
        classification.isVideo,
        safeRawUrl,
        safeMimeType,
        filePath
      ),
      audio: buildOpenGraphAudio(classification.isAudio, safeRawUrl, safeMimeType),
    },
    twitter: buildTwitterMetadata(classification, {
      title: baseTitle,
      description: baseDescription,
      rawUrl: safeRawUrl,
      fileUrl,
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
  baseUrl: string
) {
  if (isImageFile) {
    return [
      {
        url: rawUrl,
        alt: 'Preview image',
        type: mimeType,
      },
    ]
  }

  // Fallback to a site banner image when no image file is available.
  // Expect a public asset at `/og/large_card_summary.png` (adjust path if needed).
  try {
    const fallbackUrl = `${baseUrl.replace(/\/$/, '')}/banner.png`
    return [
      {
        url: fallbackUrl,
        alt: 'Emberly banner',
        type: 'image/png',
      },
    ]
  } catch (err) {
    return undefined
  }
}

async function buildOpenGraphVideos(
  isVideoFile: boolean,
  rawUrl: string,
  mimeType: string,
  filePath: string
) {
  if (!isVideoFile) return undefined

  let videoUrl = rawUrl
  try {
    const storageProvider = await getStorageProvider()
    if (storageProvider && typeof storageProvider.getFileUrl === 'function') {
      videoUrl = await storageProvider.getFileUrl(filePath)
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
      images: [rawUrl],
    }
  }

  if (classification.isVideo) {
    if (!fileUrl || !rawUrl) return undefined

    return {
      card: 'player' as const,
      title,
      description,
      players: [
        {
          url: String(fileUrl),
          stream: String(rawUrl),
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
