import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import {
  createLinodeBucket,
  createLinodeKeys,
  listLinodeClusters,
  listLinodeKeys,
  listLinodeStorageTypes,
} from '@/packages/lib/storage/providers/linode'

const logger = loggers.storage

/**
 * GET /api/admin/storage/linode
 * Returns all Linode-provider ObjectStoragePool records enriched with live
 * cluster and type info.  Also exposes clusters and types as resource queries.
 */
export async function GET(req: Request) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const url = new URL(req.url)

    if (url.searchParams.get('resource') === 'clusters') {
      const clusters = await listLinodeClusters()
      return apiResponse(clusters)
    }
    if (url.searchParams.get('resource') === 'types') {
      const types = await listLinodeStorageTypes()
      return apiResponse(types)
    }

    const pools = await prisma.objectStoragePool.findMany({
      where: { provider: 'linode' },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { storageBuckets: true } } },
    })

    const result = pools.map((pool) => {
      const meta = pool.metadata as {
        keyId?: number
        linodeClusterId?: string
      } | null
      return {
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
        userBucketCount: pool._count.storageBuckets,
        createdAt: pool.createdAt,
      }
    })

    return apiResponse(result)
  } catch (error) {
    logger.error('Failed to list Linode Object Storage pools', error as Error)
    return apiError('Internal server error')
  }
}

/**
 * POST /api/admin/storage/linode
 * Creates a new Linode Object Storage pool:
 *   1. Creates a Linode access key for the chosen cluster.
 *   2. Saves an ObjectStoragePool record in the DB.
 *
 * Body: { clusterId: string, label: string, tier?: string }
 */
export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const body = await req.json()
    const { clusterId, label, tier } = body

    if (!clusterId || typeof clusterId !== 'string') {
      return apiError('clusterId (string) is required', HTTP_STATUS.BAD_REQUEST)
    }
    if (!label?.trim()) {
      return apiError('label is required', HTTP_STATUS.BAD_REQUEST)
    }

    // Validate cluster exists
    const clusters = await listLinodeClusters()
    const cluster = clusters.find((c) => c.id === clusterId)
    if (!cluster) {
      return apiError(
        'Cluster not found or unavailable',
        HTTP_STATUS.BAD_REQUEST
      )
    }
    if (cluster.status !== 'available') {
      return apiError(
        'Cluster is not currently available',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Create an unrestricted access key for this cluster
    const keyLabel = `emberly-${clusterId}-${Date.now()}`
    const linodeKey = await createLinodeKeys(keyLabel, undefined, [
      { id: cluster.region },
    ])
    logger.info(
      `[Admin] Created Linode access key ${linodeKey.id} for cluster ${clusterId}`
    )

    // Determine the S3 endpoint from the key's region list
    const regionEntry = linodeKey.regions?.find((r) => r.id === cluster.region)
    const s3Hostname =
      regionEntry?.s3_endpoint ?? `${clusterId}.linodeobjects.com`

    // Create a test bucket to verify credentials (non-fatal)
    // (Linode doesn't have a dry-run; we skip this for now)

    const pool = await prisma.objectStoragePool.create({
      data: {
        provider: 'linode',
        externalId: keyLabel,
        label: label.trim(),
        region: cluster.region,
        s3Hostname,
        s3AccessKey: linodeKey.access_key,
        s3SecretKey: linodeKey.secret_key,
        tier: tier?.trim() || 'standard',
        status: 'active',
        metadata: {
          keyId: linodeKey.id,
          linodeClusterId: clusterId,
        },
      },
    })

    logger.info(
      `[Admin] Provisioned Linode Object Storage pool ${pool.id} (cluster: ${clusterId})`
    )

    return apiResponse({
      id: pool.id,
      externalId: pool.externalId,
      label: pool.label,
      region: pool.region,
      linodeClusterId: clusterId,
      tier: pool.tier,
      status: pool.status,
      s3Hostname: pool.s3Hostname,
      s3AccessKey: `${pool.s3AccessKey.slice(0, 6)}••••`,
    })
  } catch (error) {
    logger.error(
      'Failed to provision Linode Object Storage pool',
      error as Error
    )
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
