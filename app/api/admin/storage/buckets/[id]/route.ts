import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.storage

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params
    const bucket = await prisma.storageBucket.findUnique({
      where: { id },
      include: {
        _count: { select: { assignedUsers: true, assignedSquads: true } },
      },
    })

    if (!bucket) return apiError('Bucket not found', HTTP_STATUS.NOT_FOUND)

    // Mask secrets on read — full secrets are never sent to the client
    return apiResponse({
      ...bucket,
      s3AccessKeyId: bucket.s3AccessKeyId
        ? `${bucket.s3AccessKeyId.slice(0, 4)}••••`
        : '',
      s3SecretKey: '',
    })
  } catch (error) {
    logger.error('Failed to get storage bucket', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params
    const body = await req.json()
    const {
      name,
      provider,
      isCore,
      priority,
      s3Bucket,
      s3Region,
      s3AccessKeyId,
      s3SecretKey,
      s3Endpoint,
      s3ForcePathStyle,
    } = body

    if (!name?.trim())
      return apiError('Bucket name is required', HTTP_STATUS.BAD_REQUEST)

    // Only update secrets if non-empty values are provided (empty = keep existing)
    const existing = await prisma.storageBucket.findUnique({ where: { id } })
    if (!existing) return apiError('Bucket not found', HTTP_STATUS.NOT_FOUND)

    const bucket = await prisma.storageBucket.update({
      where: { id },
      data: {
        name: name.trim(),
        provider: provider ?? existing.provider,
        isCore: isCore !== undefined ? Boolean(isCore) : existing.isCore,
        priority: priority !== undefined ? Number(priority) : existing.priority,
        s3Bucket: s3Bucket ?? existing.s3Bucket,
        s3Region: s3Region ?? existing.s3Region,
        s3AccessKeyId: s3AccessKeyId?.trim()
          ? s3AccessKeyId
          : existing.s3AccessKeyId,
        s3SecretKey: s3SecretKey?.trim() ? s3SecretKey : existing.s3SecretKey,
        s3Endpoint:
          s3Endpoint !== undefined ? s3Endpoint || null : existing.s3Endpoint,
        s3ForcePathStyle: s3ForcePathStyle ?? existing.s3ForcePathStyle,
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
    logger.error('Failed to update storage bucket', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params

    // Clear assignments before deleting so foreign keys don't block
    await prisma.user.updateMany({
      where: { storageBucketId: id },
      data: { storageBucketId: null },
    })
    await prisma.nexiumSquad.updateMany({
      where: { storageBucketId: id },
      data: { storageBucketId: null },
    })

    await prisma.storageBucket.delete({ where: { id } })

    return apiResponse({ deleted: true })
  } catch (error) {
    logger.error('Failed to delete storage bucket', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
