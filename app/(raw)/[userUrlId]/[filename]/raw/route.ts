import { NextResponse } from 'next/server'

import { compare } from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { Readable } from 'stream'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database/prisma'
import { getStorageProvider } from '@/lib/storage'

function encodeFilename(filename: string): string {
  const encoded = encodeURIComponent(filename)
  return `"${encoded.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function createRobustStream(nodeStream: Readable): ReadableStream {
  let streamClosed = false
  let controller: ReadableStreamDefaultController | null = null
  let isPulling = false

  return new ReadableStream(
    {
      start(ctrl) {
        controller = ctrl

        nodeStream.on('data', (chunk) => {
          if (streamClosed) return

          try {
            controller?.enqueue(new Uint8Array(chunk))
          } catch (error) {
            const err = error as Error & { code?: string }
            if (
              err.code !== 'ECONNRESET' &&
              !err.message?.includes('aborted')
            ) {
              console.error('Error enqueueing chunk:', error)
            }
            if (!streamClosed) {
              streamClosed = true
              if (!nodeStream.destroyed) {
                nodeStream.destroy()
              }
            }
          }
        })

        nodeStream.on('end', () => {
          if (!streamClosed) {
            try {
              controller?.close()
            } catch {
              // Client disconnected
            }
            streamClosed = true
          }
        })

        nodeStream.on('error', (error) => {
          const err = error as Error & { code?: string }
          if (
            err.code !== 'ECONNRESET' &&
            err.code !== 'ERR_STREAM_PREMATURE_CLOSE' &&
            !err.message?.includes('aborted')
          ) {
            console.error('Node stream error:', error)
          }
          if (!streamClosed) {
            streamClosed = true
            if (!nodeStream.destroyed) {
              nodeStream.destroy()
            }
          }
        })
      },

      pull() {
        if (!isPulling && !streamClosed) {
          isPulling = true
          nodeStream.resume()
          process.nextTick(() => {
            isPulling = false
          })
        }
      },

      cancel() {
        streamClosed = true
        if (!nodeStream.destroyed) {
          nodeStream.destroy()
        }
      },
    },
    {
      highWaterMark: 65536, // 64KB buffer for smooth streaming
    }
  )
}

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

    let file = await prisma.file.findUnique({
      where: { urlPath },
    })

    if (!file && filename.includes(' ')) {
      const urlSafeFilename = filename.replace(/ /g, '-')
      const urlSafePath = `/${userUrlId}/${urlSafeFilename}`
      file = await prisma.file.findUnique({
        where: { urlPath: urlSafePath },
      })
    }

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

    const storageProvider = await getStorageProvider()
    const range = req.headers.get('range')

    // Diagnostic logging: capture request context to aid debugging when
    // origin requests fail (Cloudflare shows 500s). These logs include the
    // DB file path, mime type, which storage provider is in use, and the
    // incoming Range header so we can correlate with object storage logs.
    try {
      console.info('Raw file request', {
        urlPath,
        path: file.path,
        mimeType: file.mimeType,
        provider: storageProvider?.constructor?.name,
        range,
        host: req.headers.get('host'),
      })
    } catch (logErr) {
      // non-fatal
    }

    const mapAwsErrorToStatus = (errAny: any): number | null => {
      try {
        const status = errAny?.$metadata?.httpStatusCode
        if (status === 403) return 403
        if (status === 404) return 404
        if (status && status >= 500 && status < 600) return 502
      } catch { }
      return null
    }

    let size: number
    try {
      size = await storageProvider.getFileSize(file.path)
    } catch (err) {
      const status = mapAwsErrorToStatus(err as any)
      if (status) return new Response(null, { status })
      try {
        // Log SDK $metadata when present to help correlate with MinIO logs
        console.error('Error fetching file size for', file.path, err, {
          awsMetadata: (err as any)?.$metadata,
        })
      } catch (logErr) {
        console.error('Error fetching file size for', file.path, err)
      }
      return new Response(null, { status: 502 })
    }

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1
      const chunkSize = end - start + 1

      try {
        const stream = await storageProvider.getFileStream(file.path, {
          start,
          end,
        })

        const headers = {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': file.mimeType,
          'Content-Disposition': `inline; filename=${encodeFilename(file.name)}`,
          'Cache-Control': 'public, max-age=31536000, immutable',
          Connection: 'keep-alive',
          'Keep-Alive': 'timeout=300, max=1000',
          'Transfer-Encoding': 'identity',
        }

        return new NextResponse(createRobustStream(stream), {
          status: 206,
          headers,
        })
      } catch (err) {
        const status = mapAwsErrorToStatus(err as any)
        if (status) return new Response(null, { status })
        try {
          console.error('Error creating ranged stream for', file.path, err, {
            awsMetadata: (err as any)?.$metadata,
          })
        } catch (logErr) {
          console.error('Error creating ranged stream for', file.path, err)
        }
        return new Response(null, { status: 502 })
      }
    }

    try {
      const stream = await storageProvider.getFileStream(file.path)
      const headers = {
        'Accept-Ranges': 'bytes',
        'Content-Length': size.toString(),
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename=${encodeFilename(file.name)}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        Connection: 'keep-alive',
        'Keep-Alive': 'timeout=300, max=1000',
        'Transfer-Encoding': 'identity',
      }

      return new NextResponse(createRobustStream(stream), { headers })
    } catch (err) {
      const status = mapAwsErrorToStatus(err as any)
      if (status) return new Response(null, { status })
      try {
        console.error('Error creating stream for', file.path, err, {
          awsMetadata: (err as any)?.$metadata,
        })
      } catch (logErr) {
        console.error('Error creating stream for', file.path, err)
      }
      return new Response(null, { status: 502 })
    }
  } catch (error) {
    console.error('File serve error:', error)
    if (error instanceof Error && error.message.includes('NoSuchKey')) {
      return new Response(null, { status: 404 })
    }
    return new Response(null, { status: 500 })
  }
}
