import {
  CreateUrlResponse,
  CreateUrlSchema,
  UrlListResponse,
} from '@/types/dto/url'
import { nanoid } from 'nanoid'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'
import { shortLinkDomains, shortLinkUrl } from '@/lib/urls/short-links'

const logger = loggers.api

const SELECT = {
  id: true,
  shortCode: true,
  targetUrl: true,
  domain: true,
  clicks: true,
  createdAt: true,
  userId: true,
} as const

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const json = await req.json()

    const result = CreateUrlSchema.safeParse(json)
    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    const { url, domain: requested } = result.data
    const { domains, defaultDomain } = await shortLinkDomains(
      user.id,
      user.preferredUploadDomain
    )

    let domain: string | null
    if (requested === undefined) {
      domain = defaultDomain
    } else if (requested === null || requested === '') {
      domain = null
    } else if (domains.includes(requested)) {
      domain = requested
    } else {
      return apiError(
        "That domain isn't one of your verified custom domains",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    let shortCode = nanoid(6)
    while (await prisma.shortenedUrl.findUnique({ where: { shortCode } })) {
      shortCode = nanoid(6)
    }

    const created = await prisma.shortenedUrl.create({
      data: { shortCode, targetUrl: url, domain, userId: user.id },
      select: SELECT,
    })

    return apiResponse<CreateUrlResponse>({
      ...created,
      url: shortLinkUrl(created.shortCode, created.domain),
    })
  } catch (error) {
    logger.error('URL creation error', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function GET(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const [urls, { domains, defaultDomain }] = await Promise.all([
      prisma.shortenedUrl.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: SELECT,
      }),
      shortLinkDomains(user.id, user.preferredUploadDomain),
    ])

    return apiResponse<UrlListResponse>({
      urls: urls.map((u) => ({
        ...u,
        // A link whose domain was since removed still works on the main site
        url: shortLinkUrl(
          u.shortCode,
          u.domain && domains.includes(u.domain) ? u.domain : null
        ),
      })),
      domains,
      defaultDomain,
    })
  } catch (error) {
    logger.error('URL list error', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
