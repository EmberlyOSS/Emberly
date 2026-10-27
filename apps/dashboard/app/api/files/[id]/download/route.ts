import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { NextRequest, NextResponse } from 'next/server'

import { checkFilePassword, clientAddress } from '@/lib/files/password-guard'

import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'
import { getProviderForStoredFile } from '@/lib/storage'
import { handleCORSPreflight, getCORSHeaders } from '@/lib/api/cors'
import { fileCacheControl } from '@/lib/files/access'
import { fileSecurityHeaders } from '@/lib/files/safe-headers'

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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return new Response(null, { status: 401 })
    }
    const { id: fileId } = await params
    const url = new URL(request.url)
    const providedPassword = url.searchParams.get('password')

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        path: true,
        mimeType: true,
        size: true,
        userId: true,
        visibility: true,
        password: true,
        storageBucketId: true,
      },
    })

    if (!file) {
      return new Response(null, { status: 404 })
    }

    const isOwner = user.id === file.userId
    const isPrivate = file.visibility === 'PRIVATE' && !isOwner

    if (isPrivate) {
      return new Response(null, { status: 404 })
    }

    if (file.password && !isOwner) {
      if (!providedPassword) {
        return new Response(null, { status: 401 })
      }

      const result = await checkFilePassword(
        file.password,
        providedPassword,
        clientAddress(request.headers)
      )
      if (!result.ok) {
        return new Response(null, {
          status: result.limited ? 429 : 401,
          headers: result.limited
            ? { 'Retry-After': String(result.retryAfter) }
            : undefined,
        })
      }
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { downloads: { increment: 1 } },
    })

    const storageProvider = await getProviderForStoredFile(file.storageBucketId)

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
        'Content-Disposition': `attachment; filename=${encodeFilename(file.name)}`,
        ...fileSecurityHeaders(file.mimeType),
        'Cache-Control': fileCacheControl(file),
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
      'Content-Disposition': `attachment; filename=${encodeFilename(file.name)}`,
      ...fileSecurityHeaders(file.mimeType),
      'Cache-Control': fileCacheControl(file),
      'Accept-Ranges': 'bytes',
      'Content-Length': size.toString(),
      ...getCORSHeaders(),
    }

    return new NextResponse(stream as unknown as ReadableStream, { headers })
  } catch (error) {
    logger.error('File download error', error as Error)
    return new Response(null, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return new Response(null, { status: 401 })
    }
    const { id: fileId } = await params

    let providedPassword: string | null = null
    try {
      const body = await request.json()
      providedPassword = body.password || null
    } catch {}

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        path: true,
        mimeType: true,
        size: true,
        userId: true,
        visibility: true,
        password: true,
        storageBucketId: true,
      },
    })

    if (!file) {
      return new Response(null, { status: 404 })
    }

    const isOwner = user.id === file.userId
    const isPrivate = file.visibility === 'PRIVATE' && !isOwner

    if (isPrivate) {
      return new Response(null, { status: 404 })
    }

    if (file.password && !isOwner) {
      if (!providedPassword) {
        return new Response(null, { status: 401 })
      }

      const result = await checkFilePassword(
        file.password,
        providedPassword,
        clientAddress(request.headers)
      )
      if (!result.ok) {
        return new Response(null, {
          status: result.limited ? 429 : 401,
          headers: result.limited
            ? { 'Retry-After': String(result.retryAfter) }
            : undefined,
        })
      }
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { downloads: { increment: 1 } },
    })

    const storageProvider = await getProviderForStoredFile(file.storageBucketId)

    const size = await storageProvider.getFileSize(file.path)

    const stream = await storageProvider.getFileStream(file.path)
    const headers = {
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename=${encodeFilename(file.name)}`,
      ...fileSecurityHeaders(file.mimeType),
      'Cache-Control': fileCacheControl(file),
      'Accept-Ranges': 'bytes',
      'Content-Length': size.toString(),
    }

    return new NextResponse(stream as unknown as ReadableStream, { headers })
  } catch (error) {
    logger.error('File download error', error as Error)
    return new Response(null, { status: 500 })
  }
}
