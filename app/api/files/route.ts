import {
  FileMetadata,
  FileUploadFormDataSchema,
  FileUploadResponse,
} from '@/packages/types/dto/file'
import { Prisma } from '@/prisma/generated/prisma/client'
import { hash } from 'bcryptjs'
import { join } from 'path'

import {
  HTTP_STATUS,
  apiError,
  apiResponse,
  paginatedResponse,
} from '@/packages/lib/api/response'
import { getSquadFromBearerToken, requireAuth } from '@/packages/lib/auth/api-auth'
import { getConfig } from '@/packages/lib/config'
import { prisma } from '@/packages/lib/database/prisma'
import {
  getFileExpirationInfo,
  scheduleFileExpiration,
} from '@/packages/lib/events/handlers/file-expiry'
import { getUniqueFilename } from '@/packages/lib/files/filename'
import { validateUploadRequest } from '@/packages/lib/files/upload-validation'
import { validateFileSecurityChecksWithVT } from '@/packages/lib/files/security-validation'
import { loggers } from '@/packages/lib/logger'
import { processImageOCR } from '@/packages/lib/ocr'
import { getStorageProvider } from '@/packages/lib/storage'
import { bytesToMB, urlForHost } from '@/packages/lib/utils'

const logger = loggers.files

export async function POST(req: Request) {
  let filePath = ''
  let userId: string | undefined

  try {
    // ── Auth: try squad token/API key first, then fall back to user session ──
    const squad = await getSquadFromBearerToken(req)

    let user: Awaited<ReturnType<typeof requireAuth>>['user'] | null = null
    let squadContext: typeof squad = null

    if (squad) {
      // Authenticated as a squad — load the owner as the acting user
      const ownerUser = await prisma.user.findUnique({
        where: { id: squad.ownerUserId },
        select: {
          id: true,
          email: true,
          name: true,
          storageUsed: true,
          storageQuotaMB: true,
          urlId: true,
          role: true,
          randomizeFileUrls: true,
          preferredUploadDomain: true,
        },
      })
      if (!ownerUser) return apiError('Squad owner not found', HTTP_STATUS.UNAUTHORIZED)
      user = ownerUser
      squadContext = squad
    } else {
      const auth = await requireAuth(req)
      if (auth.response) return auth.response
      user = auth.user
    }
    userId = user?.id
    if (!user) return apiError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return apiError('Failed to parse request body as multipart/form-data. Ensure Content-Type is multipart/form-data with a valid boundary.', HTTP_STATUS.BAD_REQUEST)
    }

    const uploadedFile = formData.get('file') as File
    const requestedDomainRaw = (formData.get('domain') as string) || null
    const requestedDomain = requestedDomainRaw
      ? requestedDomainRaw.replace(/^https?:\/\//, '').replace(/\/+$/, '')
      : null
    const visibility =
      (formData.get('visibility') as 'PUBLIC' | 'PRIVATE') || 'PUBLIC'
    const password = formData.get('password') as string | null
    const expiresAt = formData.get('expiresAt') as string | null
    const allowSuggestions = formData.get('allowSuggestions') === 'true'

    const result = FileUploadFormDataSchema.safeParse({
      file: uploadedFile,
      visibility,
      password,
    })

    let expirationDate: Date | null = null
    if (expiresAt) {
      expirationDate = new Date(expiresAt)
      if (isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
        return apiError(
          'Invalid expiration date. Must be in the future.',
          HTTP_STATUS.BAD_REQUEST
        )
      }
    }

    if (!result.success) {
      return apiError(result.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    // Check file size against plan upload cap and storage quota
    if (user.role !== 'ADMIN') {
      const { getPlanLimits, canUploadSize } = await import('@/packages/lib/storage/quota')
      const planLimits = await getPlanLimits(user.id)
      const fileSizeMB = bytesToMB(uploadedFile.size)
      
      // Check plan upload size cap (null = unlimited for Ember/Enterprise)
      if (planLimits.uploadSizeCapMB !== null) {
        const maxUploadBytes = planLimits.uploadSizeCapMB * 1024 * 1024
        if (uploadedFile.size > maxUploadBytes) {
          return apiError(
            `File exceeds ${planLimits.planName} plan limit of ${planLimits.uploadSizeCapMB}MB. Upgrade your plan to upload larger files.`,
            HTTP_STATUS.PAYLOAD_TOO_LARGE
          )
        }
      }
      
      // For squad uploads, also check squad storage quota
      if (squadContext) {
        const squadQuotaMB = squadContext.storageQuotaMB
        if (squadQuotaMB !== null) {
          const squadUsedMB = bytesToMB(squadContext.storageUsed)
          if (squadUsedMB + fileSizeMB > squadQuotaMB) {
            return apiError(
              'Squad storage quota exceeded.',
              HTTP_STATUS.PAYLOAD_TOO_LARGE
            )
          }
        }
      } else {
        // Check individual user storage quota
        const uploadCheck = await canUploadSize(user.id, fileSizeMB)
        if (!uploadCheck.allowed) {
          return apiError(
            uploadCheck.reason || 'Storage quota exceeded. Purchase additional storage to continue uploading.',
            HTTP_STATUS.PAYLOAD_TOO_LARGE
          )
        }
      }
    }

    // Validate email verification and custom domain verification
    const uploadValidation = await validateUploadRequest(user.id, requestedDomain)
    if (!uploadValidation.valid) {
      return apiError(uploadValidation.error!, HTTP_STATUS.FORBIDDEN)
    }

    const { urlSafeName, displayName } = await getUniqueFilename(
      join('uploads', user.urlId),
      uploadedFile.name,
      user.randomizeFileUrls
    )

    filePath = join('uploads', user.urlId, urlSafeName)
    const urlPath = `/${user.urlId}/${urlSafeName}`

    const storageProvider = await getStorageProvider()
    const bytes = await uploadedFile.arrayBuffer()
    
    // Security check: validate file against zip bombs, malware, dangerous types, and VirusTotal
    const securityCheck = await validateFileSecurityChecksWithVT(
      Buffer.from(bytes),
      uploadedFile.name,
      uploadedFile.type
    )
    if (!securityCheck.valid) {
      logger.warn('File security validation failed', {
        fileName: uploadedFile.name,
        mimeType: uploadedFile.type,
        error: securityCheck.error,
        virusTotal: securityCheck.virusTotal,
        userId: user.id,
      })
      return apiError(
        securityCheck.error || 'File failed security validation',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    if (securityCheck.virusTotal?.scanPerformed) {
      logger.info('File scanned by VirusTotal', {
        fileName: uploadedFile.name,
        detected: securityCheck.virusTotal.detected,
        detectionRatio: securityCheck.virusTotal.detectionRatio,
        permalink: securityCheck.virusTotal.permalink,
        userId: user.id,
      })
    }

    if (securityCheck.warnings?.length) {
      logger.info('File security warnings', {
        fileName: uploadedFile.name,
        warnings: securityCheck.warnings,
        userId: user.id,
      })
    }
    
    // carry through host headers as metadata so storage/proxy can use them
    const meta: Record<string, string> = {}
    try {
      const reqHeaders = (req as any).headers as Headers | undefined
      if (reqHeaders) {
        const cordx = reqHeaders.get?.('x-cordx-host')
        const emberly = reqHeaders.get?.('x-emberly-host')
        if (cordx) meta['x-cordx-host'] = cordx
        if (emberly) meta['x-emberly-host'] = emberly
      }
    } catch (e) {
      // ignore
    }

    await storageProvider.uploadFile(
      Buffer.from(bytes),
      filePath,
      uploadedFile.type,
      meta
    )

    const fileRecord = await prisma.$transaction(async (tx) => {
      const file = await tx.file.create({
        data: {
          name: displayName,
          urlPath,
          mimeType: uploadedFile.type,
          size: bytesToMB(uploadedFile.size),
          path: filePath,
          visibility: visibility,
          password: password ? await hash(password, 10) : null,
          userId: user.id,
          allowSuggestions,
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: { storageUsed: { increment: bytesToMB(uploadedFile.size) } },
      })

      // Track squad storage usage when uploaded via squad token/API key
      if (squadContext) {
        await tx.nexiumSquad.update({
          where: { id: squadContext.squadId },
          data: { storageUsed: { increment: uploadedFile.size } },
        })
      }

      return file
    })

    if (uploadedFile.type.startsWith('image/')) {
      processImageOCR(filePath, fileRecord.id).catch((error) => {
        logger.error('Background OCR processing failed', error as Error, {
          fileId: fileRecord.id,
          filePath,
        })
      })
    }

    if (expirationDate) {
      try {
        await scheduleFileExpiration(
          fileRecord.id,
          user.id,
          displayName,
          expirationDate
        )
        logger.info('File expiration scheduled', {
          fileId: fileRecord.id,
          fileName: displayName,
          expirationDate,
        })
      } catch (error) {
        logger.error('Failed to schedule file expiration', error as Error, {
          fileId: fileRecord.id,
        })
      }
    }

    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : process.env.NEXTAUTH_URL?.replace(/\/$/, '') || ''
    const fullUrl = (baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`).replace(/\/+$/, '')

    const sanitizeHost = (host: string) => urlForHost(host).replace(/\/+$/, '')
    const preferredHost = user.preferredUploadDomain
      ? sanitizeHost(user.preferredUploadDomain)
      : null

    // Start with preferred host or default fullUrl
    let finalFullUrl = preferredHost ?? fullUrl

    // If the request explicitly provided a domain form field and it's a verified
    // custom domain for the user, prefer that.
    if (requestedDomain) {
      try {
        const domainRecord = await prisma.customDomain.findFirst({
          where: { domain: requestedDomain, userId: user.id, verified: true },
        })
        if (domainRecord) {
          finalFullUrl = sanitizeHost(domainRecord.domain)
          logger.info('Using requested domain for upload URL', {
            userId: user.id,
            requestedDomain: domainRecord.domain,
          })
        }
      } catch (err) {
        // ignore DB errors here and fall back to preferred/default
      }
    } else {
      // No explicit domain provided — check if the incoming request host
      // matches a verified custom domain for this user. If so, return URLs
      // that use the request host so clients posting directly to their
      // custom upload domain receive shareable links on that same domain.
      try {
        let requestHost: string | null = null
        try {
          const hdrs = (req as any).headers as Headers | undefined
          requestHost = hdrs?.get?.('host') || (hdrs as any)?.host || null
        } catch (e) {
          requestHost = null
        }

        if (requestHost) {
          // strip port if present
          requestHost = requestHost.replace(/:\\d+$/, '')
          if (requestHost !== '') {
            const hostRecord = await prisma.customDomain.findFirst({
              where: { domain: requestHost, userId: user.id, verified: true },
            })
            if (hostRecord) {
              finalFullUrl = sanitizeHost(requestHost)
              logger.info('Using request host for upload URL', {
                userId: user.id,
                requestHost,
              })
            }
          }
        }
      } catch (err) {
        // ignore DB errors and fall back to preferred/default
      }
    }

    const responseData: FileUploadResponse = {
      url: `${finalFullUrl}${urlPath}`,
      name: displayName,
      size: uploadedFile.size,
      type: uploadedFile.type,
    }

    return apiResponse<FileUploadResponse>(responseData)
  } catch (error) {
    logger.error('Upload error', error as Error, {
      userId,
    })

    if (filePath) {
      try {
        const storageProvider = await getStorageProvider()
        await storageProvider.deleteFile(filePath)
        logger.info('Cleaned up file after error', { filePath })
      } catch (unlinkError) {
        logger.error('Failed to clean up file', unlinkError as Error, {
          filePath,
        })
      }
    }

    return apiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuth(request)
    if (response) return response

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'newest'
    const types = searchParams.get('types')?.split(',') || []
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const visibilityFilters = searchParams.get('visibility')?.split(',') || []
    const squadId = searchParams.get('squadId') || null
    const offset = (page - 1) * limit

    // ── Squad view: verify membership then return squad-owned files ──
    if (squadId) {
      const membership = await prisma.nexiumSquadMember.findFirst({
        where: { squadId, userId: user.id },
      })
      if (!membership) {
        return apiError('Not a member of this squad', HTTP_STATUS.FORBIDDEN)
      }

      const where: Prisma.FileWhereInput = { squadId }
      const conditions: Prisma.FileWhereInput[] = []

      if (search) {
        conditions.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { ocrText: { contains: search, mode: 'insensitive' } },
          ],
        })
      }
      if (types.length > 0) conditions.push({ mimeType: { in: types } })
      if (dateFrom || dateTo) {
        const dateFilter: Prisma.DateTimeFilter = {}
        if (dateFrom) dateFilter.gte = new Date(dateFrom)
        if (dateTo) { const e = new Date(dateTo); e.setHours(23,59,59,999); dateFilter.lte = e }
        conditions.push({ uploadedAt: dateFilter })
      }
      if (visibilityFilters.length > 0) {
        const visConds = visibilityFilters.map((f) =>
          f === 'hasPassword' ? { password: { not: null } } : { visibility: f.toUpperCase() as 'PUBLIC' | 'PRIVATE' }
        )
        conditions.push({ OR: visConds })
      }
      if (conditions.length > 0) where.AND = conditions

      const orderBy: Prisma.FileOrderByWithRelationInput = {}
      if (sortBy === 'oldest') orderBy.uploadedAt = 'asc'
      else if (sortBy === 'largest') orderBy.size = 'desc'
      else if (sortBy === 'smallest') orderBy.size = 'asc'
      else if (sortBy === 'name') orderBy.name = 'asc'
      else orderBy.uploadedAt = 'desc'

      const [total, files] = await Promise.all([
        prisma.file.count({ where }),
        prisma.file.findMany({
          where,
          orderBy,
          take: limit,
          skip: offset,
          select: {
            id: true,
            name: true,
            urlPath: true,
            mimeType: true,
            size: true,
            uploadedAt: true,
            visibility: true,
            password: true,
            views: true,
            downloads: true,
            user: { select: { urlId: true } },
          },
        }),
      ])

      const filesList = await Promise.all(
        files.map(async (file) => {
          const expiresAt = await getFileExpirationInfo(file.id)
          return { ...file, hasPassword: Boolean(file.password), expiresAt }
        })
      )

      return paginatedResponse<FileMetadata[]>(filesList as (FileMetadata & { expiresAt: Date | null })[],
        { total, pageCount: Math.ceil(total / limit), page, limit }
      )
    }

    // ── Personal files ──
    const where: Prisma.FileWhereInput = { userId: user.id }

    const conditions: Prisma.FileWhereInput[] = []

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { ocrText: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    if (types.length > 0) {
      conditions.push({ mimeType: { in: types } })
    }

    if (dateFrom || dateTo) {
      const dateFilter: Prisma.DateTimeFilter = {}
      if (dateFrom) {
        const startDate = new Date(dateFrom)
        dateFilter.gte = startDate
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        dateFilter.lte = endDate
      }
      conditions.push({ uploadedAt: dateFilter })
    }

    if (visibilityFilters.length > 0) {
      const visibilityConditions = []

      for (const filter of visibilityFilters) {
        if (filter === 'hasPassword') {
          visibilityConditions.push({ password: { not: null } })
        } else {
          visibilityConditions.push({
            visibility: filter.toUpperCase() as 'PUBLIC' | 'PRIVATE',
          })
        }
      }

      conditions.push({ OR: visibilityConditions })
    }

    if (conditions.length > 0) {
      where.AND = conditions
    }

    const orderBy: Prisma.FileOrderByWithRelationInput = {}
    switch (sortBy) {
      case 'oldest':
        orderBy.uploadedAt = 'asc'
        break
      case 'largest':
        orderBy.size = 'desc'
        break
      case 'smallest':
        orderBy.size = 'asc'
        break
      case 'most-viewed':
        orderBy.views = 'desc'
        break
      case 'least-viewed':
        orderBy.views = 'asc'
        break
      case 'most-downloaded':
        orderBy.downloads = 'desc'
        break
      case 'least-downloaded':
        orderBy.downloads = 'asc'
        break
      case 'name':
        orderBy.name = 'asc'
        break
      default:
        orderBy.uploadedAt = 'desc'
    }

    const total = await prisma.file.count({ where })

    const files = await prisma.file.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        urlPath: true,
        mimeType: true,
        size: true,
        uploadedAt: true,
        visibility: true,
        password: true,
        views: true,
        downloads: true,
        user: {
          select: {
            urlId: true,
          },
        },
      },
    })

    const filesList = (await Promise.all(
      files.map(async (file) => {
        const expiresAt = await getFileExpirationInfo(file.id)
        return {
          ...file,
          hasPassword: Boolean(file.password),
          expiresAt,
        }
      })
    )) as (FileMetadata & { expiresAt: Date | null })[]

    const pagination = {
      total,
      pageCount: Math.ceil(total / limit),
      page,
      limit,
    }

    return paginatedResponse<FileMetadata[]>(filesList, pagination)
  } catch (error) {
    logger.error('Error fetching files', error as Error)
    return apiError('Failed to fetch files', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
