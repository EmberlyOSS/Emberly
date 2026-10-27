import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { Readable } from 'stream'

import { authOptions } from '@/lib/auth'
import { NO_STORE, checkFileAccess, fileCacheControl } from '@/lib/files/access'
import { fileSecurityHeaders } from '@/lib/files/safe-headers'
import { getProviderForStoredFile } from '@/lib/storage'

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Access-Control-Expose-Headers':
    'Content-Length, Content-Range, Accept-Ranges',
}

export interface ServableFile {
  name: string
  path: string
  mimeType: string
  userId: string
  visibility: string
  password: string | null
  storageBucketId: string | null
}

export function encodeFilename(filename: string): string {
  const encoded = encodeURIComponent(filename)
  return `"${encoded.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export function emptyResponse(status: number) {
  return new Response(null, {
    status,
    headers: { ...CORS_HEADERS, 'Cache-Control': NO_STORE },
  })
}

/**
 * Checks access to a file, only reading the session when the file is private
 * or password protected so public files skip the auth lookup entirely.
 */
export async function denyFileAccess(
  req: Request,
  file: Pick<ServableFile, 'userId' | 'visibility' | 'password'>
): Promise<Response | null> {
  const restricted = file.visibility === 'PRIVATE' || !!file.password
  if (!restricted) return null

  const session = await getServerSession(authOptions)
  const deny = await checkFileAccess(file, {
    userId: session?.user?.id,
    providedPassword: new URL(req.url).searchParams.get('password'),
    request: req,
  })
  return deny ? emptyResponse(deny.status) : null
}

function toWebStream(nodeStream: Readable): ReadableStream {
  let closed = false
  const close = () => {
    closed = true
    if (!nodeStream.destroyed) nodeStream.destroy()
  }

  return new ReadableStream(
    {
      start(controller) {
        nodeStream.on('data', (chunk) => {
          if (closed) return
          try {
            controller.enqueue(new Uint8Array(chunk))
          } catch {
            close()
          }
        })
        nodeStream.on('end', () => {
          if (closed) return
          closed = true
          try {
            controller.close()
          } catch {}
        })
        nodeStream.on('error', (error) => {
          const err = error as Error & { code?: string }
          if (
            err.code !== 'ECONNRESET' &&
            err.code !== 'ERR_STREAM_PREMATURE_CLOSE' &&
            !err.message?.includes('aborted')
          ) {
            console.error('File stream error:', error)
          }
          if (!closed) {
            try {
              controller.error(error)
            } catch {}
            close()
          }
        })
      },
      cancel: close,
    },
    { highWaterMark: 65536 }
  )
}

/** Streams a stored file, honouring Range requests. */
export async function serveStoredFile(
  req: Request,
  file: ServableFile,
  { head = false }: { head?: boolean } = {}
): Promise<Response> {
  const storage = await getProviderForStoredFile(file.storageBucketId)
  const baseHeaders = {
    ...CORS_HEADERS,
    'Accept-Ranges': 'bytes',
    'Content-Type': file.mimeType,
    'Content-Disposition': `inline; filename=${encodeFilename(file.name)}`,
    'Cache-Control': fileCacheControl(file),
    ...fileSecurityHeaders(file.mimeType),
  }

  const range = head ? null : req.headers.get('range')

  if (!range) {
    const [size, stream] = await Promise.all([
      storage.getFileSize(file.path),
      head ? null : storage.getFileStream(file.path),
    ])
    const headers = { ...baseHeaders, 'Content-Length': size.toString() }
    if (!stream) return new NextResponse(null, { status: 200, headers })
    return new NextResponse(toWebStream(stream), { headers })
  }

  const size = await storage.getFileSize(file.path)
  const [startText, endText] = range.replace(/bytes=/, '').split('-')
  const start = parseInt(startText, 10)
  const end = endText ? Math.min(parseInt(endText, 10), size - 1) : size - 1

  if (Number.isNaN(start) || start > end || start >= size) {
    return new NextResponse(null, {
      status: 416,
      headers: { ...CORS_HEADERS, 'Content-Range': `bytes */${size}` },
    })
  }

  const stream = await storage.getFileStream(file.path, { start, end })
  return new NextResponse(toWebStream(stream), {
    status: 206,
    headers: {
      ...baseHeaders,
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': (end - start + 1).toString(),
    },
  })
}
