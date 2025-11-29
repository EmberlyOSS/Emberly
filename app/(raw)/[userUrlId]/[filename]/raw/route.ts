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

    // Try to get file size, but handle failures gracefully
    // Some S3 configurations forbid HeadObject, and GetObject fallback may also fail
    let size: number | undefined
    try {
      size = await storageProvider.getFileSize(file.path)
    } catch (sizeError) {
      // If getFileSize fails, log a warning but continue
      // We can still serve the file without Content-Length using chunked encoding
      const errAny = sizeError as any
      const httpStatusCode =
        errAny?.httpStatusCode || errAny?.$metadata?.httpStatusCode

      // Only log if it's not a permission error (those are expected in some configs)
      if (httpStatusCode !== 403) {
        console.warn(
          `Failed to get file size for ${file.path}, will serve without Content-Length:`,
          errAny?.message || sizeError
        )
      }
    }

    if (range) {
      // For range requests, we need the file size to calculate Content-Range
      if (!size) {
        // Without size, we can't properly serve range requests
        // Fall back to serving the full file
        console.warn(
          `Range request received but file size unknown for ${file.path}, serving full file`
        )
        const stream = await storageProvider.getFileStream(file.path)
        const headers = {
          'Accept-Ranges': 'bytes',
          'Content-Type': file.mimeType,
          'Content-Disposition': `inline; filename=${encodeFilename(file.name)}`,
          'Cache-Control': 'public, max-age=31536000, immutable',
          Connection: 'keep-alive',
          'Keep-Alive': 'timeout=300, max=1000',
          'Transfer-Encoding': 'chunked',
        }
        return new NextResponse(createRobustStream(stream), { headers })
      }

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
    }

    // For non-range requests, we can serve without knowing the size upfront
    const stream = await storageProvider.getFileStream(file.path)
    const headers: Record<string, string> = {
      'Accept-Ranges': 'bytes',
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename=${encodeFilename(file.name)}`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      Connection: 'keep-alive',
      'Keep-Alive': 'timeout=300, max=1000',
    }

    // Only set Content-Length if we have the size
    if (size) {
      headers['Content-Length'] = size.toString()
      headers['Transfer-Encoding'] = 'identity'
    } else {
      // Use chunked encoding if we don't know the size
      headers['Transfer-Encoding'] = 'chunked'
    }

    return new NextResponse(createRobustStream(stream), { headers })
  } catch (error) {
    // Log richer error details for debugging (AWS SDK errors include $metadata)
    const errAny = error as any
    const httpStatusCode =
      errAny?.httpStatusCode || errAny?.$metadata?.httpStatusCode

    console.error('File serve error:', errAny)
    try {
      console.error('File serve error details:', {
        name: errAny?.name,
        code: errAny?.code || errAny?.name,
        fault: errAny?.$fault,
        httpStatusCode,
        awsMetadata: errAny?.$metadata,
        message: errAny?.message,
      })
    } catch {
      // ignore logging errors
    }

    // Check for specific AWS/S3 error types
    if (
      error instanceof Error &&
      (error.message.includes('NoSuchKey') ||
        error.message.includes('File not found') ||
        httpStatusCode === 404)
    ) {
      return new Response(null, { status: 404 })
    }

    // Log permission errors with more detail
    if (
      error instanceof Error &&
      (error.message.includes('Access denied') ||
        error.message.includes('permission') ||
        httpStatusCode === 403)
    ) {
      console.error(
        'S3 permission error detected. Check IAM permissions for s3:HeadObject and s3:GetObject operations.',
        {
          path: errAny?.key || 'unknown',
          error: error.message,
          httpStatusCode,
        }
      )
    }

    return new Response(null, { status: 500 })
  }
}
