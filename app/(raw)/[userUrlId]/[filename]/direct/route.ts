import { NextResponse } from 'next/server'

import { compare } from 'bcryptjs'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { S3StorageProvider, getStorageProvider } from '@/lib/storage'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userUrlId: string; filename: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { userUrlId, filename } = await params
    const urlPath = `/${userUrlId}/${filename}`
    const url = new URL(req.url)
    const providedPassword = url.searchParams.get('password')

    const file = await prisma.file.findUnique({
      where: { urlPath },
    })

    if (!file) {
      return new Response(null, { status: 404 })
    }

    const isOwner = session?.user?.id === file.userId
    const isPrivate = file.visibility === 'PRIVATE' && !session?.user

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

    const isVideo = file.mimeType.startsWith('video/')
    if (!isVideo) {
      return new Response(null, { status: 400, statusText: 'Not a video file' })
    }

    const storageProvider = await getStorageProvider()

    const rawUrl = `${urlPath}/raw${providedPassword ? `?password=${providedPassword}` : ''}`

    if (!(storageProvider instanceof S3StorageProvider)) {
      return NextResponse.json({ url: rawUrl })
    }

    try {
      const directUrl = await storageProvider.getFileUrl(file.path)
      return NextResponse.json({ url: directUrl })
    } catch (err) {
      // Signing or endpoint issues shouldn't completely break sharing —
      // fall back to returning the proxied raw URL so clients can still
      // stream the file through the app's proxy endpoint.
      console.error(
        'Error generating direct S3 URL, falling back to proxied raw URL',
        {
          path: file.path,
          error: err,
        }
      )
      return NextResponse.json({ url: rawUrl })
    }
  } catch (error) {
    console.error('Direct URL error:', error)
    return new Response(null, { status: 500 })
  }
}
