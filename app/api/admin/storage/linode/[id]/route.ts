import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import {
  createLinodeKeys,
  deleteLinodeKeys,
} from '@/packages/lib/storage/providers/linode'

const logger = loggers.storage

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/storage/linode/[id]
 * Returns a single Linode Object Storage pool with its user buckets.
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

    if (!pool || pool.provider !== 'linode')
      return apiError('Pool not found', HTTP_STATUS.NOT_FOUND)

    const meta = pool.metadata as {
      keyId?: number
      linodeClusterId?: string
    } | null

    return apiResponse({
      id: pool.id,
      externalId: pool.externalId,
      label: pool.label,
      region: pool.region,
      linodeClusterId: meta?.linodeClusterId ?? null,
      keyId: meta?.keyId ?? null,
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
    logger.error('Failed to get Linode Object Storage pool', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/**
 * DELETE /api/admin/storage/linode/[id]?confirm=true
 * Revokes the Linode access key and removes the pool from the DB.
 * WARNING: All user buckets using this key will immediately lose access.
 */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params
    const url = new URL(req.url)

    if (url.searchParams.get('confirm') !== 'true') {
      return apiError(
        'Add ?confirm=true to confirm deletion. This revokes the access key and deactivates all user buckets.',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const pool = await prisma.objectStoragePool.findUnique({ where: { id } })
    if (!pool || pool.provider !== 'linode')
      return apiError('Pool not found', HTTP_STATUS.NOT_FOUND)

    const meta = pool.metadata as { keyId?: number } | null

    // Revoke the Linode access key
    if (meta?.keyId) {
      try {
        await deleteLinodeKeys(meta.keyId)
        logger.info(`[Admin] Revoked Linode access key ${meta.keyId}`)
      } catch (err) {
        logger.warn(
          `[Admin] Failed to revoke Linode access key ${meta.keyId}`,
          { error: err }
        )
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
    logger.error('Failed to delete Linode Object Storage pool', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/**
 * POST /api/admin/storage/linode/[id]?action=regenerate-keys
 * Creates a new Linode access key, updates the pool record and all child
 * StorageBucket credentials, then revokes the old key.
 * WARNING: Active uploads using the old key will fail during rotation.
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
    if (!pool || pool.provider !== 'linode')
      return apiError('Pool not found', HTTP_STATUS.NOT_FOUND)

    const meta = pool.metadata as {
      keyId?: number
      linodeClusterId?: string
    } | null
    const oldKeyId = meta?.keyId

    // Create a new key first so service is not interrupted
    const newKeyLabel = `emberly-${meta?.linodeClusterId ?? pool.region}-${Date.now()}`
    const newKey = await createLinodeKeys(
      newKeyLabel,
      undefined,
      meta?.linodeClusterId ? [{ id: meta.linodeClusterId }] : undefined
    )
    logger.info(
      `[Admin] Created new Linode key ${newKey.id} for pool ${pool.id}`
    )

    await prisma.$transaction([
      prisma.objectStoragePool.update({
        where: { id },
        data: {
          externalId: newKeyLabel,
          s3AccessKey: newKey.access_key,
          s3SecretKey: newKey.secret_key,
          metadata: { ...meta, keyId: newKey.id },
        },
      }),
      prisma.storageBucket.updateMany({
        where: { objectStoragePoolId: id },
        data: {
          s3AccessKeyId: newKey.access_key,
          s3SecretKey: newKey.secret_key,
        },
      }),
    ])

    // Revoke old key after DB is updated
    if (oldKeyId) {
      try {
        await deleteLinodeKeys(oldKeyId)
        logger.info(`[Admin] Revoked old Linode key ${oldKeyId}`)
      } catch (err) {
        logger.warn(`[Admin] Failed to revoke old Linode key ${oldKeyId}`, {
          error: err,
        })
      }
    }

    return apiResponse({
      rotated: true,
      s3AccessKey: `${newKey.access_key.slice(0, 6)}••••`,
    })
  } catch (error) {
    logger.error(
      'Failed to regenerate Linode Object Storage keys',
      error as Error
    )
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
