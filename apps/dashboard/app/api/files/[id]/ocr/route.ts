import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'

import { checkFilePassword, clientAddress } from '@/lib/files/password-guard'

import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'
import { rateLimiter } from '@/lib/cache/rate-limit'
import { runOnDemandOCR } from '@/lib/ocr/on-demand'

const logger = loggers.files

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const url = new URL(req.url)
    const providedPassword = url.searchParams.get('password')

    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        userId: true,
        mimeType: true,
        isOcrProcessed: true,
        ocrText: true,
        path: true,
        ocrConfidence: true,
        visibility: true,
        password: true,
      },
    })

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
        },
        { status: 404 }
      )
    }

    if (!file.mimeType.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'File is not an image',
        },
        { status: 400 }
      )
    }

    const user = await getAuthenticatedUser(req)
    const isOwner = user?.id === file.userId

    if (file.visibility === 'PRIVATE' && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    if (file.password && !isOwner) {
      if (!providedPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'Password required',
          },
          { status: 401 }
        )
      }

      const result = await checkFilePassword(
        file.password,
        providedPassword,
        clientAddress(req.headers)
      )
      if (!result.ok) {
        return NextResponse.json(
          {
            success: false,
            error: result.limited
              ? 'Too many wrong passwords. Try again later.'
              : 'Invalid password',
          },
          {
            status: result.limited ? 429 : 401,
            headers: result.limited
              ? { 'Retry-After': String(result.retryAfter) }
              : undefined,
          }
        )
      }
    }

    // Anyone can re-run an image that was never processed; only the owner can retry one that found nothing
    const needsRun = !file.isOcrProcessed || (isOwner && !file.ocrText)

    if (needsRun) {
      const limit = await rateLimiter.check(
        `ocr:${user?.id ?? clientAddress(req.headers)}`,
        20,
        10 * 60
      )
      if (!limit.allowed) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(
                Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))
              ),
            },
          }
        )
      }

      const run = await runOnDemandOCR(file.path, id)
      if (run.status === 'busy') {
        return NextResponse.json(
          { success: false, error: 'Text extraction is busy. Try again soon.' },
          { status: 503, headers: { 'Retry-After': '30' } }
        )
      }
      if (run.status === 'cooling-down') {
        return NextResponse.json(
          {
            success: false,
            error: 'Couldn’t read text from this image. Try again later.',
          },
          { status: 503, headers: { 'Retry-After': '300' } }
        )
      }
      return NextResponse.json(run.result)
    }

    return NextResponse.json({
      success: true,
      text: file.ocrText,
      confidence: file.ocrConfidence,
    })
  } catch (error) {
    logger.error('OCR fetch error:', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch OCR text',
      },
      { status: 500 }
    )
  }
}
