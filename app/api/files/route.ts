import {
  FileMetadata,
  FileUploadFormDataSchema,
  FileUploadResponse,
} from '@/packages/types/dto/file'
import { Prisma } from '@/prisma/generated/prisma/client'
import { hash } from 'bcryptjs'
import { posix } from 'path'

import {
  HTTP_STATUS,
  apiError,
  apiResponse,
  paginatedResponse,
} from '@/packages/lib/api/response'
import {
  getSquadFromBearerToken,
  requireAuth,
} from '@/packages/lib/auth/api-auth'
import { getConfig } from '@/packages/lib/config'
import { prisma } from '@/packages/lib/database/prisma'
import {
  getFileExpirationInfoBatch,
  scheduleFileExpiration,
} from '@/packages/lib/events/handlers/file-expiry'
import { getUniqueFilename } from '@/packages/lib/files/filename'
import { validateUploadRequest } from '@/packages/lib/files/upload-validation'
import {
  validateFileSecurityChecks,
  scanWithVirusTotal,
} from '@/packages/lib/files/security-validation'
import { loggers } from '@/packages/lib/logger'
import { processImageOCR } from '@/packages/lib/ocr'
import {
  getStorageProvider,
  getUploadBucketForUser,
  getUploadBucketForSquad,
} from '@/packages/lib/storage'
import { bytesToMB, urlForHost } from '@/packages/lib/utils'

const logger = loggers.files

export async function POST(req: Request) {
  let filePath = ''
  let userId: string | undefined
  let storageProvider:
    | Awaited<ReturnType<typeof getStorageProvider>>
    | undefined

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
          emailVerified: true,
        },
      })
      if (!ownerUser)
        return apiError('Squad owner not found', HTTP_STATUS.UNAUTHORIZED)
      user = { ...ownerUser, emailVerified: ownerUser.emailVerified !== null }
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
      return apiError(
        'Failed to parse request body as multipart/form-data. Ensure Content-Type is multipart/form-data with a valid boundary.',
        HTTP_STATUS.BAD_REQUEST
      )
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

    const fileSizeMB = bytesToMB(uploadedFile.size)

    // Check file size against plan upload cap and storage quota
    if (user.role !== 'ADMIN') {
      const { getPlanLimits, canUploadSize } =
        await import('@/packages/lib/storage/quota')
      const planLimits = await getPlanLimits(user.id)

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
            uploadCheck.reason ||
              'Storage quota exceeded. Purchase additional storage to continue uploading.',
            HTTP_STATUS.PAYLOAD_TOO_LARGE
          )
        }
      }
    }

    // Validate email verification and custom domain verification
    // Pass preloaded user data to skip the redundant DB round-trip in validateEmailVerified
    const uploadValidation = await validateUploadRequest(
      user.id,
      requestedDomain,
      { emailVerified: user.emailVerified, role: user.role }
    )
    if (!uploadValidation.valid) {
      return apiError(uploadValidation.error!, HTTP_STATUS.FORBIDDEN)
    }

    // Resolve upload destination: dedicated bucket → core bucket → global fallback
    const uploadDest = squadContext
      ? await getUploadBucketForSquad(squadContext.squadId)
      : await getUploadBucketForUser(user.id)
    const storageBucketId = uploadDest?.bucket.id ?? null

    // Buffer file + resolve unique filename in parallel (provider already resolved above)
    const [buf, { urlSafeName, displayName }] = await Promise.all([
      uploadedFile.arrayBuffer().then((ab) => Buffer.from(ab)),
      getUniqueFilename(
        posix.join('uploads', user.urlId),
        uploadedFile.name,
        user.randomizeFileUrls
      ),
    ])
    storageProvider = uploadDest?.provider ?? (await getStorageProvider())

    filePath = posix.join('uploads', user.urlId, urlSafeName)
    const urlPath = `/${user.urlId}/${urlSafeName}`

    // Fast local security checks only (extension, MIME, zip bomb) — no network calls
    const securityCheck = validateFileSecurityChecks(
      buf,
      uploadedFile.name,
      uploadedFile.type
    )
    if (!securityCheck.valid) {
      logger.warn('File security validation failed', {
        fileName: uploadedFile.name,
        mimeType: uploadedFile.type,
        error: securityCheck.error,
        userId: user.id,
      })
      return apiError(
        securityCheck.error || 'File failed security validation',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Carry through host headers as metadata so storage/proxy can use them
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

    // Hash password before the transaction so bcrypt doesn't block DB time
    const passwordHash = password ? await hash(password, 10) : null

    await storageProvider.uploadFile(buf, filePath, uploadedFile.type, meta)

    const fileRecord = await prisma.$transaction(async (tx) => {
      const file = await tx.file.create({
        data: {
          name: displayName,
          urlPath,
          mimeType: uploadedFile.type,
          size: fileSizeMB,
          path: filePath,
          visibility: visibility,
          password: passwordHash,
          userId: user.id,
          allowSuggestions,
          storageBucketId,
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: { storageUsed: { increment: fileSizeMB } },
      })

      // Track squad storage usage when uploaded via squad token/API key
      if (squadContext) {
        await tx.nexiumSquad.update({
          where: { id: squadContext.squadId },
          data: { storageUsed: { increment: fileSizeMB } },
        })
      }

      // Keep the bucket's file counter in sync for load-balancing accuracy
      if (storageBucketId) {
        await tx.storageBucket.update({
          where: { id: storageBucketId },
          data: { fileCount: { increment: 1 } },
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

    // VirusTotal scan runs in the background after the response is sent.
    // On detection the file is deleted from storage and marked in the DB.
    scanWithVirusTotal(buf, uploadedFile.type, async (vtResult) => {
      logger.warn('VirusTotal detected malware — quarantining file', {
        fileId: fileRecord.id,
        detectionRatio: vtResult.detectionRatio,
        permalink: vtResult.permalink,
        userId: user.id,
      })
      const results = await Promise.allSettled([
        storageProvider!.deleteFile(filePath),
        prisma.file.update({
          where: { id: fileRecord.id },
          data: { visibility: 'PRIVATE', name: '[Quarantined]' },
        }),
      ])
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          logger.error(
            `Quarantine step ${i === 0 ? 'storage delete' : 'db update'} failed`,
            r.reason as Error,
            { fileId: fileRecord.id }
          )
        }
      })
    }).catch((err) => {
      logger.error('Background VirusTotal scan failed', err as Error, {
        fileId: fileRecord.id,
      })
    })

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
        : (process.env.NEXTAUTH_URL?.endsWith('/')
            ? process.env.NEXTAUTH_URL.slice(0, -1)
            : process.env.NEXTAUTH_URL) || ''
    const trimTrailingSlashes = (s: string) => {
      let end = s.length
      while (end > 0 && s[end - 1] === '/') end--
      return end === s.length ? s : s.slice(0, end)
    }

    const fullUrl = trimTrailingSlashes(
      baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
    )

    const sanitizeHost = (host: string) => trimTrailingSlashes(urlForHost(host))
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
      id: fileRecord.id,
      url: `${finalFullUrl}${urlPath}/`,
      name: displayName,
      size: uploadedFile.size,
      type: uploadedFile.type,
    }

    return apiResponse<FileUploadResponse>(responseData)
  } catch (error) {
    logger.error('Upload error', error as Error, {
      userId,
    })

    if (filePath && storageProvider) {
      try {
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
        if (dateTo) {
          const e = new Date(dateTo)
          e.setHours(23, 59, 59, 999)
          dateFilter.lte = e
        }
        conditions.push({ uploadedAt: dateFilter })
      }
      if (visibilityFilters.length > 0) {
        const visConds = visibilityFilters.map((f) =>
          f === 'hasPassword'
            ? { password: { not: null } }
            : { visibility: f.toUpperCase() as 'PUBLIC' | 'PRIVATE' }
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

      const expirationMap = await getFileExpirationInfoBatch(
        files.map((f) => f.id)
      )
      const filesList = files.map((file) => ({
        ...file,
        hasPassword: Boolean(file.password),
        expiresAt: expirationMap.get(file.id) ?? null,
      }))

      return paginatedResponse<FileMetadata[]>(
        filesList as (FileMetadata & { expiresAt: Date | null })[],
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
          user: {
            select: {
              urlId: true,
            },
          },
        },
      }),
    ])

    const expirationMap = await getFileExpirationInfoBatch(
      files.map((f) => f.id)
    )
    const filesList = files.map((file) => ({
      ...file,
      hasPassword: Boolean(file.password),
      expiresAt: expirationMap.get(file.id) ?? null,
    })) as (FileMetadata & { expiresAt: Date | null })[]

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
