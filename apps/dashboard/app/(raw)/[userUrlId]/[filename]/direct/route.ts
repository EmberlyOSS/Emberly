import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { NO_STORE, checkFileAccess } from '@/lib/files/access'
import { buildRawUrl, findFileByUrlPath } from '@/lib/files/lookup'
import { getStorageProvider } from '@/lib/storage'

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
      return new Response(null, {
        status: 404,
        headers: { 'Cache-Control': NO_STORE },
      })
    }

    const deny = await checkFileAccess(file, {
      userId: session?.user?.id,
      providedPassword,
    })
    if (deny) return deny

    const isVideo = file.mimeType.startsWith('video/')
    if (!isVideo) {
      return new Response(null, {
        status: 400,
        statusText: 'Not a video file',
        headers: { 'Cache-Control': NO_STORE },
      })
    }

    const storageProvider = await getStorageProvider()

    // Always route through our raw proxy endpoint — never return a direct storage URL.
    // This ensures storage provider hostnames (e.g. vultrobjects.com) are never exposed.
    void storageProvider // provider confirmed to exist
    // May embed the password, so it must never be cached
    return NextResponse.json(
      { url: buildRawUrl(urlPath, providedPassword) },
      { headers: { 'Cache-Control': NO_STORE } }
    )
  } catch (error) {
    console.error('Direct URL error:', error)
    return new Response(null, {
      status: 500,
      headers: { 'Cache-Control': NO_STORE },
    })
  }
}
