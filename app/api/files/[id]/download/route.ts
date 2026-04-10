import { getAuthenticatedUser } from '@/packages/lib/auth/api-auth'
import { NextRequest, NextResponse } from 'next/server'

import { compare } from 'bcryptjs'

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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
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

      const isPasswordValid = await compare(providedPassword, file.password)
      if (!isPasswordValid) {
        return new Response(null, { status: 401 })
      }
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { downloads: { increment: 1 } },
    })

    const storageProvider = await getStorageProvider()

    if ('getDownloadUrl' in storageProvider && storageProvider.getDownloadUrl) {
      const downloadUrl = await storageProvider.getDownloadUrl(
        file.path,
        file.name
      )
      return Response.redirect(downloadUrl, 302)
    }

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
    const { id: fileId } = await params

    let providedPassword: string | null = null
    try {
      const body = await request.json()
      providedPassword = body.password || null
    } catch { }

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

      const isPasswordValid = await compare(providedPassword, file.password)
      if (!isPasswordValid) {
        return new Response(null, { status: 401 })
      }
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { downloads: { increment: 1 } },
    })

    const storageProvider = await getStorageProvider()

    if ('getDownloadUrl' in storageProvider && storageProvider.getDownloadUrl) {
      const downloadUrl = await storageProvider.getDownloadUrl(
        file.path,
        file.name
      )
      return Response.redirect(downloadUrl, 302)
    }

    const size = await storageProvider.getFileSize(file.path)

    const stream = await storageProvider.getFileStream(file.path)
    const headers = {
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename=${encodeFilename(file.name)}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': size.toString(),
    }

    return new NextResponse(stream as unknown as ReadableStream, { headers })
  } catch (error) {
    logger.error('File download error', error as Error)
    return new Response(null, { status: 500 })
  }
}
