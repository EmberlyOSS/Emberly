import {
  CreateUrlResponse,
  CreateUrlSchema,
  UrlListResponse,
} from '@/types/dto/url'
import { nanoid } from 'nanoid'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/database/prisma'
import { loggers } from '@/lib/logger'

const logger = loggers.api

function generateShortCode() {
  return nanoid(6)
}

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    let json
    try {
      json = await req.json()
    } catch (error) {
      return apiError('Invalid JSON body', HTTP_STATUS.BAD_REQUEST)
    }

    const result = CreateUrlSchema.safeParse(json)
    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const { url } = result.data

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return apiError('Invalid URL format', HTTP_STATUS.BAD_REQUEST)
    }

    let shortCode = generateShortCode()
    let isUnique = false
    let attempts = 0
    const maxAttempts = 100

    while (!isUnique && attempts < maxAttempts) {
      const existing = await prisma.shortenedUrl.findUnique({
        where: { shortCode },
      })
      if (!existing) {
        isUnique = true
      } else {
        shortCode = generateShortCode()
        attempts++
      }
    }

    if (!isUnique) {
      logger.error(
        'Failed to generate unique short code after maximum attempts'
      )
      return apiError(
        'Failed to generate unique short code',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    const shortenedUrl = await prisma.shortenedUrl.create({
      data: {
        shortCode,
        targetUrl: url,
        userId: user.id,
      },
    })

    return apiResponse<CreateUrlResponse>(shortenedUrl)
  } catch (error) {
    logger.error('URL creation error', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function GET(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const urls = await prisma.shortenedUrl.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return apiResponse<UrlListResponse>({ urls })
  } catch (error) {
    logger.error('URL list error', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
