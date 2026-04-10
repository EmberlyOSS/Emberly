import { NextRequest, NextResponse } from 'next/server'

import { readFile } from 'fs/promises'
import { join } from 'path'

import { loggers } from '@/packages/lib/logger'
import { S3StorageProvider, getStorageProvider } from '@/packages/lib/storage'
import { handleCORSPreflight, getCORSHeaders } from '@/packages/lib/api/cors'

const logger = loggers.files

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const preflightResponse = handleCORSPreflight(request)
  if (preflightResponse) return preflightResponse
  return new Response(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const filepath = join('avatars', filename)

    const storageProvider = await getStorageProvider()

    if (storageProvider instanceof S3StorageProvider) {
      const fileUrl = await storageProvider.getFileUrl(filepath)
      return NextResponse.redirect(fileUrl)
    }

    const localFilepath = join('uploads', filepath)
    const stream = await storageProvider.getFileStream(localFilepath)
    // If a local provider is used, try to read a sidecar .meta.json and surface
    // x-cordx-host / x-emberly-host as response headers so downstream proxies
    // or CDN layers can be aware of host hints. Non-fatal if metadata missing.
    const headers: Record<string, string> = {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...getCORSHeaders(),
    }
    try {
      const metaPath = join(process.cwd(), 'uploads', filepath) + '.meta.json'
      const data = await readFile(metaPath, 'utf8')
      const meta = JSON.parse(data)
      if (meta['x-cordx-host']) headers['x-cordx-host'] = meta['x-cordx-host']
      if (meta['x-emberly-host'])
        headers['x-emberly-host'] = meta['x-emberly-host']
    } catch (err) {
      // ignore missing metadata
    }

    return new NextResponse(stream as unknown as ReadableStream, {
      headers,
    })
  } catch (error) {
    logger.error('Avatar serve error', error as Error, {
      filename: (await params).filename,
    })
    return new Response(null, { status: 500 })
  }
}
