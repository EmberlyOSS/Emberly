import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { NO_STORE, checkFileAccess, fileCacheControl } from '@/lib/files/access'
import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'
import { getProviderForStoredFile } from '@/lib/storage'
import { handleCORSPreflight, getCORSHeaders } from '@/lib/api/cors'
import { fileSecurityHeaders } from '@/lib/files/safe-headers'
import { describeStorageError, isStorageNotFound } from '@/lib/storage/errors'

const logger = loggers.files

function encodeFilename(filename: string): string {
  const encoded = encodeURIComponent(filename)
  return `"${encoded.replace(/["\\]/g, '\\$&')}"`
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const preflightResponse = handleCORSPreflight(request)
  if (preflightResponse) return preflightResponse
  return new Response(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  let logContext: Record<string, unknown> = {}
  try {
    const { path } = await params
    const session = await getServerSession(authOptions)
    let urlPath = '/' + path.join('/')
    urlPath = urlPath.replace(/\/$/, '')
    if (urlPath.includes('\u0000')) {
      return new Response(null, {
        status: 404,
        headers: { 'Cache-Control': NO_STORE },
      })
    }
    const url = new URL(request.url)
    const providedPassword = url.searchParams.get('password')
    const isDownloadRequest = url.searchParams.get('download') === 'true'

    // urlPath here is already assembled from the path segments
    let file = await prisma.file.findUnique({
      where: { urlPath },
      include: {
        user: { select: { enableRichEmbeds: true } },
        storageBucket: { select: { id: true } },
      },
    })

    if (!file && urlPath.includes(' ')) {
      file = await prisma.file.findUnique({
        where: { urlPath: urlPath.replace(/ /g, '-') },
        include: {
          user: { select: { enableRichEmbeds: true } },
          storageBucket: { select: { id: true } },
        },
      })
    }

    if (!file) {
      return new Response(null, {
        status: 404,
        headers: { 'Cache-Control': NO_STORE },
      })
    }

    const deny = await checkFileAccess(file, {
      userId: session?.user?.id,
      providedPassword,
      request,
    })
    if (deny) return deny

    logContext = {
      fileId: file.id,
      urlPath,
      storagePath: file.path,
      storageBucketId: file.storageBucket?.id ?? null,
    }

    if (isDownloadRequest) {
      await prisma.file.update({
        where: { id: file.id },
        data: { downloads: { increment: 1 } },
      })
    }

    // Check if user has rich embeds disabled - if so, force download
    const enableRichEmbeds = file.user?.enableRichEmbeds ?? true
    const shouldForceDownload = isDownloadRequest || !enableRichEmbeds

    const storageProvider = await getProviderForStoredFile(
      file.storageBucket?.id
    )
    const range = request.headers.get('range')
    const size = await storageProvider.getFileSize(file.path)

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1
      const chunkSize = end - start + 1

      const stream = await storageProvider.getFileStream(file.path, {
        start,
        end,
      })

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': file.mimeType,
        'Content-Disposition': `${shouldForceDownload ? 'attachment' : 'inline'}; filename=${encodeFilename(file.name)}`,
        'Cache-Control': fileCacheControl(file),
        ...fileSecurityHeaders(file.mimeType),
        ...getCORSHeaders(),
      }

      return new NextResponse(stream as unknown as ReadableStream, {
        status: 206,
        headers,
      })
    }

    const stream = await storageProvider.getFileStream(file.path)
    const headers = {
      'Content-Type': file.mimeType,
      'Content-Disposition': `${shouldForceDownload ? 'attachment' : 'inline'}; filename=${encodeFilename(file.name)}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': size.toString(),
      'Cache-Control': fileCacheControl(file),
      ...fileSecurityHeaders(file.mimeType),
      ...getCORSHeaders(),
    }

    return new NextResponse(stream as unknown as ReadableStream, { headers })
  } catch (error) {
    if (isStorageNotFound(error)) {
      logger.warn('Stored file is missing', logContext)
      return new Response(null, {
        status: 404,
        headers: { 'Cache-Control': NO_STORE },
      })
    }
    logger.error('File serve error', error, {
      ...logContext,
      storage: describeStorageError(error),
    })

    // A storage failure is not "not found"; never let it be cached as one
    return new Response(null, {
      status: 502,
      headers: { 'Cache-Control': NO_STORE },
    })
  }
}
