import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import {
  createOVHStorageCredentials,
  deleteOVHStorageCredentials,
} from '@/packages/lib/storage/providers/ovhcloud'

const logger = loggers.storage

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/storage/ovhcloud/[id]
 * Returns a single OVHcloud Object Storage pool with its user buckets.
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params

    const pool = await prisma.objectStoragePool.findUnique({
      where: { id },
      include: {
        storageBuckets: {
          select: {
            id: true,
            name: true,
            poolBucketName: true,
            provisionStatus: true,
            stripeSubscriptionId: true,
            createdAt: true,
            assignedUsers: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!pool || pool.provider !== 'ovhcloud')
      return apiError('Pool not found', HTTP_STATUS.NOT_FOUND)

    const meta = pool.metadata as {
      projectId?: string
      regionName?: string
      credentialAccess?: string
    } | null

    return apiResponse({
      id: pool.id,
      externalId: pool.externalId,
      label: pool.label,
      region: pool.region,
      projectId: meta?.projectId ?? null,
      regionName: meta?.regionName ?? null,
      tier: pool.tier,
      status: pool.status,
      s3Hostname: pool.s3Hostname,
      s3AccessKey: pool.s3AccessKey
        ? `${pool.s3AccessKey.slice(0, 6)}••••`
        : '',
      createdAt: pool.createdAt,
      storageBuckets: pool.storageBuckets,
    })
  } catch (error) {
    logger.error('Failed to get OVHcloud Object Storage pool', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/**
 * DELETE /api/admin/storage/ovhcloud/[id]?confirm=true
 * Revokes the OVHcloud S3 credentials and removes the pool from the DB.
 * WARNING: All user containers using these credentials will lose access.
 */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params
    const url = new URL(req.url)

    if (url.searchParams.get('confirm') !== 'true') {
      return apiError(
        'Add ?confirm=true to confirm deletion. This revokes S3 credentials and deactivates all user containers.',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const pool = await prisma.objectStoragePool.findUnique({ where: { id } })
    if (!pool || pool.provider !== 'ovhcloud')
      return apiError('Pool not found', HTTP_STATUS.NOT_FOUND)

    const meta = pool.metadata as {
      projectId?: string
      credentialAccess?: string
    } | null

    // Revoke OVH S3 credentials
    if (meta?.projectId && meta?.credentialAccess) {
      try {
        await deleteOVHStorageCredentials(meta.projectId, meta.credentialAccess)
        logger.info(
          `[Admin] Revoked OVHcloud S3 credentials ${meta.credentialAccess}`
        )
      } catch (err) {
        logger.warn(`[Admin] Failed to revoke OVHcloud credentials`, {
          error: err,
        })
        // Continue — still clean up the DB
      }
    }

    // Clear user assignments and delete child StorageBucket records
    const buckets = await prisma.storageBucket.findMany({
      where: { objectStoragePoolId: id },
    })
    for (const bucket of buckets) {
      await prisma.user.updateMany({
        where: { storageBucketId: bucket.id },
        data: { storageBucketId: null },
      })
      await prisma.nexiumSquad.updateMany({
        where: { storageBucketId: bucket.id },
        data: { storageBucketId: null },
      })
    }
    await prisma.storageBucket.deleteMany({
      where: { objectStoragePoolId: id },
    })
    await prisma.objectStoragePool.delete({ where: { id } })

    return apiResponse({ deleted: true })
  } catch (error) {
    logger.error(
      'Failed to delete OVHcloud Object Storage pool',
      error as Error
    )
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/**
 * POST /api/admin/storage/ovhcloud/[id]?action=regenerate-keys
 * Generates new OVHcloud S3 credentials, updates the pool + child StorageBucket
 * records atomically, then revokes the old credentials.
 * WARNING: Active uploads using the old credentials will fail during rotation.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params
    const url = new URL(req.url)

    if (url.searchParams.get('action') !== 'regenerate-keys') {
      return apiError(
        'Unknown action. Use ?action=regenerate-keys',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const pool = await prisma.objectStoragePool.findUnique({ where: { id } })
    if (!pool || pool.provider !== 'ovhcloud')
      return apiError('Pool not found', HTTP_STATUS.NOT_FOUND)

    const meta = pool.metadata as {
      projectId?: string
      regionName?: string
      credentialAccess?: string
    } | null

    if (!meta?.projectId) {
      return apiError(
        'Pool metadata is missing projectId',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    const oldAccess = meta.credentialAccess

    // Create new credentials first
    const newCreds = await createOVHStorageCredentials(meta.projectId)
    logger.info(
      `[Admin] Created new OVHcloud S3 credentials for project ${meta.projectId}`
    )

    await prisma.$transaction([
      prisma.objectStoragePool.update({
        where: { id },
        data: {
          s3AccessKey: newCreds.access,
          s3SecretKey: newCreds.secret,
          metadata: { ...meta, credentialAccess: newCreds.access },
        },
      }),
      prisma.storageBucket.updateMany({
        where: { objectStoragePoolId: id },
        data: {
          s3AccessKeyId: newCreds.access,
          s3SecretKey: newCreds.secret,
        },
      }),
    ])

    // Revoke old credentials after DB update
    if (oldAccess) {
      try {
        await deleteOVHStorageCredentials(meta.projectId, oldAccess)
        logger.info(`[Admin] Revoked old OVHcloud credentials ${oldAccess}`)
      } catch (err) {
        logger.warn(
          `[Admin] Failed to revoke old OVHcloud credentials ${oldAccess}`,
          { error: err }
        )
      }
    }

    return apiResponse({
      rotated: true,
      s3AccessKey: `${newCreds.access.slice(0, 6)}••••`,
    })
  } catch (error) {
    logger.error(
      'Failed to regenerate OVHcloud Object Storage credentials',
      error as Error
    )
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
