import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.storage

export async function GET(req: Request) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const buckets = await prisma.storageBucket.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        provider: true,
        isCore: true,
        priority: true,
        fileCount: true,
        provisionStatus: true,
        s3Bucket: true,
        s3Region: true,
        s3Endpoint: true,
        s3ForcePathStyle: true,
        vultrObjectStorageId: true,
        vultrBucketName: true,
        createdAt: true,
        updatedAt: true,
        // Return masked versions of secrets — never expose raw keys
        s3AccessKeyId: true,
        _count: {
          select: { assignedUsers: true, assignedSquads: true, files: true },
        },
      },
    })

    // Mask the actual keys for the listing response
    return apiResponse(
      buckets.map((b) => ({
        ...b,
        s3AccessKeyId: b.s3AccessKeyId
          ? `${b.s3AccessKeyId.slice(0, 4)}••••`
          : '',
        s3SecretKey: '',
      }))
    )
  } catch (error) {
    logger.error('Failed to list storage buckets', error as Error)
    return apiError('Internal server error')
  }
}

export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const body = await req.json()
    const {
      name,
      provider = 's3',
      isCore = false,
      priority = 0,
      s3Bucket,
      s3Region,
      s3AccessKeyId,
      s3SecretKey,
      s3Endpoint,
      s3ForcePathStyle,
      vultrObjectStorageId,
      vultrBucketName,
    } = body

    if (!name?.trim())
      return apiError('Bucket name is required', HTTP_STATUS.BAD_REQUEST)

    // For Vultr-backed buckets, populate S3 credentials from the existing VultrObjectStorage record
    if (provider === 'vultr') {
      if (!vultrObjectStorageId)
        return apiError('Vultr instance is required', HTTP_STATUS.BAD_REQUEST)
      if (!vultrBucketName?.trim())
        return apiError(
          'Bucket name within the Vultr instance is required',
          HTTP_STATUS.BAD_REQUEST
        )

      const vultr = await prisma.vultrObjectStorage.findUnique({
        where: { id: vultrObjectStorageId },
      })
      if (!vultr)
        return apiError(
          'Vultr Object Storage instance not found',
          HTTP_STATUS.NOT_FOUND
        )

      const bucket = await prisma.storageBucket.create({
        data: {
          name: name.trim(),
          provider: 's3',
          isCore: Boolean(isCore),
          priority: Number(priority) || 0,
          s3Bucket: vultrBucketName.trim(),
          s3Region: vultr.region,
          s3AccessKeyId: vultr.s3AccessKey,
          s3SecretKey: vultr.s3SecretKey,
          s3Endpoint: `https://${vultr.s3Hostname}`,
          s3ForcePathStyle: false,
          vultrObjectStorageId: vultr.id,
          vultrBucketName: vultrBucketName.trim(),
        },
      })

      return apiResponse({
        ...bucket,
        s3AccessKeyId: bucket.s3AccessKeyId
          ? `${bucket.s3AccessKeyId.slice(0, 4)}••••`
          : '',
        s3SecretKey: '',
      })
    }

    const bucket = await prisma.storageBucket.create({
      data: {
        name: name.trim(),
        provider,
        isCore: Boolean(isCore),
        priority: Number(priority) || 0,
        s3Bucket: s3Bucket ?? '',
        s3Region: s3Region ?? '',
        s3AccessKeyId: s3AccessKeyId ?? '',
        s3SecretKey: s3SecretKey ?? '',
        s3Endpoint: s3Endpoint || null,
        s3ForcePathStyle: s3ForcePathStyle ?? false,
      },
    })

    return apiResponse({
      ...bucket,
      s3AccessKeyId: bucket.s3AccessKeyId
        ? `${bucket.s3AccessKeyId.slice(0, 4)}••••`
        : '',
      s3SecretKey: '',
    })
  } catch (error) {
    logger.error('Failed to create storage bucket', error as Error)
    return apiError('Internal server error')
  }
}
