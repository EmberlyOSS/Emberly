import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.storage

interface Params {
  params: Promise<{ id: string }>
}

/** Assign or clear a dedicated storage bucket for a user. Body: { bucketId: string | null } */
export async function PUT(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id: userId } = await params
    const body = await req.json()
    const bucketId: string | null = body?.bucketId ?? null

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, storageBucketId: true },
    })
    if (!user) return apiError('User not found', HTTP_STATUS.NOT_FOUND)

    if (bucketId) {
      const bucket = await prisma.storageBucket.findUnique({
        where: { id: bucketId },
        select: { id: true, provisionStatus: true },
      })
      if (!bucket)
        return apiError('Storage bucket not found', HTTP_STATUS.NOT_FOUND)
      if (bucket.provisionStatus !== 'active') {
        return apiError(
          'Cannot assign a bucket that is not active',
          HTTP_STATUS.BAD_REQUEST
        )
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { storageBucketId: bucketId },
    })

    logger.info('Admin assigned storage bucket to user', {
      userId,
      bucketId,
      previousBucketId: user.storageBucketId,
    })

    return apiResponse({ userId, storageBucketId: bucketId })
  } catch (error) {
    logger.error('Failed to assign storage bucket to user', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/** GET current bucket assignment for a user. */
export async function GET(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id: userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        storageBucketId: true,
        storageBucket: {
          select: {
            id: true,
            name: true,
            provider: true,
            isCore: true,
            provisionStatus: true,
            s3Region: true,
            s3Bucket: true,
            fileCount: true,
            createdAt: true,
          },
        },
      },
    })
    if (!user) return apiError('User not found', HTTP_STATUS.NOT_FOUND)

    return apiResponse({
      userId: user.id,
      storageBucketId: user.storageBucketId,
      bucket: user.storageBucket ?? null,
    })
  } catch (error) {
    logger.error('Failed to get user storage bucket assignment', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
