import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { checkFileAccess } from '@/packages/lib/files/access'
import { buildRawUrl, findFileByUrlPath } from '@/packages/lib/files/lookup'
import { S3StorageProvider, getStorageProvider } from '@/packages/lib/storage'

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

    const file = await findFileByUrlPath(userUrlId, filename)

    if (!file) {
      return new Response(null, { status: 404 })
    }

    const deny = await checkFileAccess(file, { userId: session?.user?.id, providedPassword })
    if (deny) return deny

    const isVideo = file.mimeType.startsWith('video/')
    if (!isVideo) {
      return new Response(null, { status: 400, statusText: 'Not a video file' })
    }

    const storageProvider = await getStorageProvider()

    if (!(storageProvider instanceof S3StorageProvider)) {
      return NextResponse.json({ url: buildRawUrl(urlPath, providedPassword) })
    }

    const directUrl = await storageProvider.getFileUrl(file.path)

    return NextResponse.json({ url: directUrl })
  } catch (error) {
    console.error('Direct URL error:', error)
    return new Response(null, { status: 500 })
  }
}