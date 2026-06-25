import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import {
  createDnsRecord,
  getZoneName,
  listDnsRecords,
} from '@/packages/lib/cloudflare/client'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import {
  createObjectStorage,
  getObjectStorage,
  listClusterTiers,
  listClusters,
  listObjectStorages,
  listTiers,
} from '@/packages/lib/storage/providers/vultr'

const logger = loggers.storage

/**
 * GET /api/admin/storage/vultr
 * Returns all VultrObjectStorage records in the DB, enriched with live Vultr
 * status and bucket counts.  Also exposes cluster and tier lists from the API.
 */
export async function GET(req: Request) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const url = new URL(req.url)

    // ?resource=clusters or ?resource=tiers[&clusterId=N] for supporting data
    if (url.searchParams.get('resource') === 'clusters') {
      const clusters = await listClusters()
      return apiResponse(clusters)
    }
    if (url.searchParams.get('resource') === 'tiers') {
      const clusterId = url.searchParams.get('clusterId')
      if (clusterId) {
        const tiers = await listClusterTiers(parseInt(clusterId))
        return apiResponse(tiers)
      }
      const tiers = await listTiers()
      return apiResponse(tiers)
    }

    // Default: list all Vultr-provider pools with live enrichment
    const [dbInstances, vultrInstances] = await Promise.allSettled([
      prisma.objectStoragePool.findMany({
        where: { provider: 'vultr' },
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { storageBuckets: true } } },
      }),
      listObjectStorages(),
    ])

    const db = dbInstances.status === 'fulfilled' ? dbInstances.value : []
    const live =
      vultrInstances.status === 'fulfilled' ? vultrInstances.value : []
    const liveMap = new Map(live.map((v) => [v.id, v]))

    // Sync status + credentials back to DB for any pools that have drifted.
    // Fire-and-forget so it doesn't slow down the response.
    const staleInstances = db.filter((instance) => {
      const liveData = liveMap.get(instance.externalId)
      if (!liveData) return false
      return (
        liveData.status !== instance.status ||
        (instance.s3AccessKey === '' && liveData.s3_access_key) ||
        (instance.s3SecretKey === '' && liveData.s3_secret_key)
      )
    })
    if (staleInstances.length > 0) {
      Promise.all(
        staleInstances.map((instance) => {
          const liveData = liveMap.get(instance.externalId)!
          return prisma.objectStoragePool.update({
            where: { id: instance.id },
            data: {
              status: liveData.status,
              ...(instance.s3AccessKey === '' && liveData.s3_access_key
                ? { s3AccessKey: liveData.s3_access_key }
                : {}),
              ...(instance.s3SecretKey === '' && liveData.s3_secret_key
                ? { s3SecretKey: liveData.s3_secret_key }
                : {}),
            },
          })
        })
      )
        .then(() => {
          logger.info(
            `[Admin] Synced ${staleInstances.length} Vultr pool(s) from live Vultr data`
          )
        })
        .catch((err) => {
          logger.warn('[Admin] Failed to sync Vultr pool status/credentials', {
            error: err,
          })
        })
    }

    const result = db.map((instance) => {
      const liveData = liveMap.get(instance.externalId)
      const meta = instance.metadata as { clusterId?: number } | null
      return {
        id: instance.id,
        externalId: instance.externalId,
        label: instance.label,
        region: instance.region,
        clusterId: meta?.clusterId ?? null,
        tier: instance.tier,
        status: liveData?.status ?? instance.status,
        s3Hostname: instance.s3Hostname,
        cfHostname: instance.cfHostname ?? null,
        // Never expose secrets in list view
        s3AccessKey:
          instance.s3AccessKey || liveData?.s3_access_key
            ? `${(instance.s3AccessKey || liveData!.s3_access_key).slice(0, 6)}••••`
            : '',
        userBucketCount: instance._count.storageBuckets,
        createdAt: instance.createdAt,
      }
    })

    return apiResponse(result)
  } catch (error) {
    logger.error(
      'Failed to list Vultr Object Storage instances',
      error as Error
    )
    return apiError('Internal server error')
  }
}

/**
 * POST /api/admin/storage/vultr
 * Provisions a new Vultr Object Storage instance and saves it in the DB.
 *
 * Body: { clusterId: number, label: string, tier?: string }
 *
 * One instance acts as a regional pool — all user buckets in that region
 * are created inside it.  The Vultr instance cost is amortised across users.
 */
export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const body = await req.json()
    const { clusterId, label, tierId } = body

    if (!clusterId || typeof clusterId !== 'number') {
      return apiError('clusterId (number) is required', HTTP_STATUS.BAD_REQUEST)
    }
    if (!tierId || typeof tierId !== 'number') {
      return apiError('tierId (number) is required', HTTP_STATUS.BAD_REQUEST)
    }
    if (!label?.trim()) {
      return apiError('label is required', HTTP_STATUS.BAD_REQUEST)
    }

    // Validate cluster
    const clusters = await listClusters()
    const cluster = clusters.find((c) => c.id === clusterId)
    if (!cluster) {
      return apiError(
        'Cluster not found or does not support Object Storage',
        HTTP_STATUS.BAD_REQUEST
      )
    }
    if (cluster.deploy !== 'yes') {
      return apiError(
        'Object Storage is not available in this cluster',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Validate tier belongs to this cluster
    const clusterTiers = await listClusterTiers(clusterId)
    const selectedTier = clusterTiers.find((t) => t.id === tierId)
    if (!selectedTier) {
      return apiError(
        'Tier not available for this cluster',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Provision on Vultr
    const vultrInstance = await createObjectStorage(
      clusterId,
      label.trim(),
      tierId
    )
    logger.info(
      `[Admin] Provisioned Vultr Object Storage: ${vultrInstance.id} in region ${vultrInstance.region}`
    )

    // Persist in DB as a unified ObjectStoragePool
    const dbInstance = await prisma.objectStoragePool.create({
      data: {
        provider: 'vultr',
        externalId: vultrInstance.id,
        label: label.trim(),
        region: vultrInstance.region,
        s3Hostname: vultrInstance.s3_hostname,
        s3AccessKey: vultrInstance.s3_access_key ?? '',
        s3SecretKey: vultrInstance.s3_secret_key ?? '',
        tier: selectedTier.sales_name,
        status: vultrInstance.status,
        metadata: { clusterId },
      },
    })

    // Auto-create a DNS-only CNAME in Cloudflare (non-fatal — not proxied for S3 API compat)
    let cfHostname: string | null = null
    try {
      // Use the actual zone name from CF (e.g. 'emberly.site') — NOT NEXT_PUBLIC_BASE_URL
      // which may be a different domain than the one the zone covers.
      const zoneName = await getZoneName()
      const cnameLabel = `storage-${vultrInstance.region}`
      cfHostname = `${cnameLabel}.${zoneName}`

      let record: { id: string; name: string }
      try {
        record = await createDnsRecord({
          type: 'CNAME',
          name: cnameLabel,
          content: vultrInstance.s3_hostname,
          proxied: false,
          ttl: 1,
        })
        logger.info(
          `[Admin] Created Cloudflare DNS record ${record.id} → ${cfHostname}`
        )
      } catch (createErr: any) {
        // cfFetch throws CloudflareError with body = full CF response JSON object.
        // Error 81053 = "Record already exists." — extract from body.errors array.
        const cfErrors: any[] = Array.isArray(createErr?.body)
          ? createErr.body
          : Array.isArray(createErr?.body?.errors)
            ? createErr.body.errors
            : []
        const isConflict =
          createErr?.status === 400 &&
          cfErrors.some((e: any) => e.code === 81053)

        if (!isConflict) throw createErr

        logger.info(
          `[Admin] CNAME ${cnameLabel} already exists in Cloudflare — looking up existing record`
        )
        const existing = await listDnsRecords({
          type: 'CNAME',
          name: cfHostname,
        })
        const match = existing?.[0]
        if (!match?.id)
          throw new Error(
            `CNAME ${cnameLabel} conflict but no matching record found in zone`
          )
        record = { id: match.id, name: match.name }
        logger.info(
          `[Admin] Reusing existing Cloudflare DNS record ${record.id} → ${cfHostname}`
        )
      }

      await prisma.objectStoragePool.update({
        where: { id: dbInstance.id },
        data: { cfHostname, cfDnsRecordId: record.id },
      })
    } catch (cfErr: any) {
      // Embed details in the message string — dev logger formatter drops structured context
      const detail = cfErr?.body
        ? `status=${cfErr.status} body=${JSON.stringify(cfErr.body)}`
        : String(cfErr?.message ?? cfErr)
      logger.warn(
        `[Admin] Cloudflare DNS record creation failed (non-fatal): ${detail}`
      )
    }

    return apiResponse({
      id: dbInstance.id,
      externalId: dbInstance.externalId,
      label: dbInstance.label,
      region: dbInstance.region,
      clusterId,
      tier: dbInstance.tier,
      status: dbInstance.status,
      s3Hostname: dbInstance.s3Hostname,
      s3AccessKey: `${dbInstance.s3AccessKey.slice(0, 6)}••••`,
      cfHostname,
    })
  } catch (error) {
    logger.error(
      'Failed to provision Vultr Object Storage instance',
      error as Error
    )
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
