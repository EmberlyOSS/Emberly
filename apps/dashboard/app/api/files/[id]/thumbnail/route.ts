import { NextRequest, NextResponse } from 'next/server'
import { NO_STORE, fileCacheControl } from '@/lib/files/access'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'

import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'
import { getProviderForStoredFile } from '@/lib/storage'
import { handleCORSPreflight, getCORSHeaders } from '@/lib/api/cors'

const logger = loggers.files

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
    const [user, { id }] = await Promise.all([
      getAuthenticatedUser(request),
      params,
    ])

    // Get file first to check visibility and ownership
    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        mimeType: true,
        path: true,
        visibility: true,
        userId: true,
        password: true,
        storageBucketId: true,
      },
    })

    if (!file) {
      return new NextResponse('File not found', {
        status: 404,
        headers: { 'Cache-Control': NO_STORE },
      })
    }

    const isImage = file.mimeType.startsWith('image/')
    const isVideo = file.mimeType.startsWith('video/')

    // For non-image/video files, redirect to the default banner
    if (!isImage && !isVideo) {
      // Return a redirect to the banner image for unsupported file types
      const baseUrl = request.headers.get('host') || 'localhost:3000'
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      return NextResponse.redirect(`${protocol}://${baseUrl}/banner.png`)
    }

    // Check access permissions (similar to main file endpoint)
    const isOwner = user?.id === file.userId
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'
    const isPrivate = file.visibility === 'PRIVATE' && !isOwner && !isAdmin

    if (isPrivate) {
      return new NextResponse('File not found', {
        status: 404,
        headers: { 'Cache-Control': NO_STORE },
      })
    }

    // For video files, redirect to banner since we can't generate thumbnails easily
    // In the future, this could be enhanced to use ffmpeg or a video processing service
    if (isVideo) {
      const baseUrl = request.headers.get('host') || 'localhost:3000'
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      return NextResponse.redirect(`${protocol}://${baseUrl}/banner.png`)
    }

    // The "thumbnail" is the original image, so it must honour the password too
    if (file.password && !isOwner && !isAdmin) {
      return new NextResponse('Password required', {
        status: 401,
        headers: { 'Cache-Control': NO_STORE },
      })
    }

    const storageProvider = await getProviderForStoredFile(file.storageBucketId)
    const fileStream = await storageProvider.getFileStream(file.path)

    // Just serve the original image - let the browser/CSS handle sizing
    return new NextResponse(fileStream as unknown as BodyInit, {
      headers: {
        'Content-Type': file.mimeType,
        'Cache-Control': fileCacheControl(file),
        ...getCORSHeaders(),
      },
    })
  } catch (error) {
    logger.error('Error serving thumbnail:', error as Error)
    return new NextResponse('Error serving thumbnail', {
      status: 500,
      headers: { 'Cache-Control': NO_STORE },
    })
  }
}
