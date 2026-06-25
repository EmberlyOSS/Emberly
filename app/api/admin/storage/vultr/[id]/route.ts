import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { deleteDnsRecord } from '@/packages/lib/cloudflare/client'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import {
  deleteObjectStorage,
  getObjectStorage,
  regenerateObjectStorageKeys,
} from '@/packages/lib/storage/providers/vultr'

const logger = loggers.storage

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/storage/vultr/[id]
 * Returns a single Vultr Object Storage instance with live Vultr data and
 * the list of user StorageBuckets provisioned inside it.
 * Note: S3 secrets are never returned to the client.
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params

    const instance = await prisma.objectStoragePool.findUnique({
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

    if (!instance || instance.provider !== 'vultr')
      return apiError('Instance not found', HTTP_STATUS.NOT_FOUND)

    const meta = instance.metadata as { clusterId?: number } | null

    // Enrich with live status + credentials from Vultr and sync back to DB if stale
    let liveStatus = instance.status
    try {
      const live = await getObjectStorage(instance.externalId)
      liveStatus = live.status

      const needsSync =
        live.status !== instance.status ||
        (instance.s3AccessKey === '' && live.s3_access_key) ||
        (instance.s3SecretKey === '' && live.s3_secret_key)

      if (needsSync) {
        await prisma.objectStoragePool.update({
          where: { id: instance.id },
          data: {
            status: live.status,
            ...(instance.s3AccessKey === '' && live.s3_access_key
              ? { s3AccessKey: live.s3_access_key }
              : {}),
            ...(instance.s3SecretKey === '' && live.s3_secret_key
              ? { s3SecretKey: live.s3_secret_key }
              : {}),
          },
        })
        logger.info(
          `[Admin] Synced Vultr pool ${instance.externalId} (status: ${instance.status} → ${live.status})`
        )
        if (instance.s3AccessKey === '' && live.s3_access_key)
          instance.s3AccessKey = live.s3_access_key
        if (instance.s3SecretKey === '' && live.s3_secret_key)
          instance.s3SecretKey = live.s3_secret_key
      }
    } catch {
      // Live status unavailable — return cached value
    }

    return apiResponse({
      id: instance.id,
      externalId: instance.externalId,
      label: instance.label,
      region: instance.region,
      clusterId: meta?.clusterId ?? null,
      tier: instance.tier,
      status: liveStatus,
      s3Hostname: instance.s3Hostname,
      cfHostname: instance.cfHostname ?? null,
      s3AccessKey: instance.s3AccessKey
        ? `${instance.s3AccessKey.slice(0, 6)}••••`
        : '',
      createdAt: instance.createdAt,
      storageBuckets: instance.storageBuckets,
    })
  } catch (error) {
    logger.error('Failed to get Vultr Object Storage instance', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/**
 * DELETE /api/admin/storage/vultr/[id]
 * Deletes the Vultr Object Storage instance.
 * WARNING: All user buckets and objects inside it will be permanently destroyed.
 * Requires ?confirm=true query param as an extra safety gate.
 */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params
    const url = new URL(req.url)

    if (url.searchParams.get('confirm') !== 'true') {
      return apiError(
        'Add ?confirm=true to confirm deletion. This permanently destroys all user data in this instance.',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const instance = await prisma.objectStoragePool.findUnique({
      where: { id },
    })
    if (!instance || instance.provider !== 'vultr')
      return apiError('Instance not found', HTTP_STATUS.NOT_FOUND)

    // Delete from Vultr
    await deleteObjectStorage(instance.externalId)
    logger.info(
      `[Admin] Deleted Vultr Object Storage instance ${instance.externalId}`
    )

    // Remove Cloudflare DNS record if one was created (non-fatal)
    if (instance.cfDnsRecordId) {
      try {
        await deleteDnsRecord(instance.cfDnsRecordId)
        logger.info(
          `[Admin] Deleted Cloudflare DNS record ${instance.cfDnsRecordId}`
        )
      } catch (cfErr) {
        logger.warn(
          '[Admin] Cloudflare DNS record deletion failed (non-fatal)',
          { error: cfErr }
        )
      }
    }

    // Clean up DB: clear assignments, delete StorageBucket records, then the pool
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
      'Failed to delete Vultr Object Storage instance',
      error as Error
    )
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/**
 * POST /api/admin/storage/vultr/[id]?action=regenerate-keys
 * Regenerates S3 access/secret keys for the Vultr instance and updates all
 * StorageBucket records that share those credentials.
 * WARNING: All active uploads using the old keys will fail during rotation.
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

    const instance = await prisma.objectStoragePool.findUnique({
      where: { id },
    })
    if (!instance || instance.provider !== 'vultr')
      return apiError('Instance not found', HTTP_STATUS.NOT_FOUND)

    const newKeys = await regenerateObjectStorageKeys(instance.externalId)
    logger.info(
      `[Admin] Regenerated keys for Vultr pool ${instance.externalId}`
    )

    // Update the pool record and all child StorageBucket records atomically
    await prisma.$transaction([
      prisma.objectStoragePool.update({
        where: { id },
        data: {
          s3AccessKey: newKeys.s3_access_key,
          s3SecretKey: newKeys.s3_secret_key,
        },
      }),
      prisma.storageBucket.updateMany({
        where: { objectStoragePoolId: id },
        data: {
          s3AccessKeyId: newKeys.s3_access_key,
          s3SecretKey: newKeys.s3_secret_key,
        },
      }),
    ])

    return apiResponse({
      rotated: true,
      s3AccessKey: `${newKeys.s3_access_key.slice(0, 6)}••••`,
    })
  } catch (error) {
    logger.error(
      'Failed to regenerate Vultr Object Storage keys',
      error as Error
    )
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
