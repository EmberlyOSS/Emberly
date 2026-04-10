import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/packages/lib/auth/api-auth'


import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { getStorageProvider } from '@/packages/lib/storage'
import { handleCORSPreflight, getCORSHeaders } from '@/packages/lib/api/cors'

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
      },
    })

    if (!file) {
      return new NextResponse('File not found', { status: 404 })
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
    const isAdmin = user?.role === 'ADMIN'
    const isPrivate = file.visibility === 'PRIVATE' && !isOwner && !isAdmin

    if (isPrivate) {
      return new NextResponse('File not found', { status: 404 })
    }

    // For video files, redirect to banner since we can't generate thumbnails easily
    // In the future, this could be enhanced to use ffmpeg or a video processing service
    if (isVideo) {
      const baseUrl = request.headers.get('host') || 'localhost:3000'
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      return NextResponse.redirect(`${protocol}://${baseUrl}/banner.png`)
    }

    // Skip password check for thumbnails (thumbnails should be accessible if file is accessible)
    const storageProvider = await getStorageProvider()
    const fileStream = await storageProvider.getFileStream(file.path)

    // Just serve the original image - let the browser/CSS handle sizing
    return new NextResponse(fileStream as unknown as BodyInit, {
      headers: {
        'Content-Type': file.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...getCORSHeaders(),
      },
    })
  } catch (error) {
    logger.error('Error serving thumbnail:', error as Error)
    return new NextResponse('Error serving thumbnail', { status: 500 })
  }
}
