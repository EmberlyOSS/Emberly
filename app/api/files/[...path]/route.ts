import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { checkFileAccess } from '@/packages/lib/files/access'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { getStorageProvider } from '@/packages/lib/storage'
import { handleCORSPreflight, getCORSHeaders } from '@/packages/lib/api/cors'

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
  try {
    const { path } = await params
    const session = await getServerSession(authOptions)
    const urlPath = '/' + path.join('/')
    const url = new URL(request.url)
    const providedPassword = url.searchParams.get('password')
    const isDownloadRequest = url.searchParams.get('download') === 'true'

    // urlPath here is already assembled from the path segments
    let file = await prisma.file.findUnique({
      where: { urlPath },
      include: { user: { select: { enableRichEmbeds: true } } },
    })

    if (!file && urlPath.includes(' ')) {
      file = await prisma.file.findUnique({
        where: { urlPath: urlPath.replace(/ /g, '-') },
        include: { user: { select: { enableRichEmbeds: true } } },
      })
    }

    if (!file) {
      return new Response(null, { status: 404 })
    }

    const deny = await checkFileAccess(file, { userId: session?.user?.id, providedPassword })
    if (deny) return deny

    if (isDownloadRequest) {
      await prisma.file.update({
        where: { id: file.id },
        data: { downloads: { increment: 1 } },
      })
    }

    // Check if user has rich embeds disabled - if so, force download
    const enableRichEmbeds = file.user?.enableRichEmbeds ?? true
    const shouldForceDownload = isDownloadRequest || !enableRichEmbeds

    const storageProvider = await getStorageProvider()
    const isVideo = file.mimeType.startsWith('video/')
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
        'Cache-Control': isVideo ? 'public, max-age=31536000' : 'no-cache',
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
      'Cache-Control': isVideo ? 'public, max-age=31536000' : 'no-cache',
      ...getCORSHeaders(),
    }

    return new NextResponse(stream as unknown as ReadableStream, { headers })
  } catch (error) {
    const errAny = error as any
    logger.error('File serve error:', error as Error)
    try {
      logger.error('File serve error details', {
        name: errAny?.name,
        code: errAny?.code || errAny?.name,
        fault: errAny?.$fault,
        awsMetadata: errAny?.$metadata,
        message: errAny?.message,
      })
    } catch {
      // ignore logging errors
    }

    return new Response(null, { status: 404 })
  }
}
