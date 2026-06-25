import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import {
  createOVHStorageCredentials,
  listOVHProjects,
  listOVHRegions,
  listOVHStoragePlans,
} from '@/packages/lib/storage/providers/ovhcloud'

const logger = loggers.storage

/**
 * GET /api/admin/storage/ovhcloud
 * Returns all OVHcloud-provider ObjectStoragePool records.
 * Resource queries: ?resource=projects, ?resource=regions&projectId=X, ?resource=plans
 */
export async function GET(req: Request) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const url = new URL(req.url)

    if (url.searchParams.get('resource') === 'projects') {
      const projects = await listOVHProjects()
      return apiResponse(projects)
    }
    if (url.searchParams.get('resource') === 'regions') {
      const projectId = url.searchParams.get('projectId')
      if (!projectId)
        return apiError(
          'projectId is required for regions query',
          HTTP_STATUS.BAD_REQUEST
        )
      const regions = await listOVHRegions(projectId)
      return apiResponse(regions)
    }
    if (url.searchParams.get('resource') === 'plans') {
      const subsidiary = url.searchParams.get('subsidiary') || 'IE'
      const plans = await listOVHStoragePlans(subsidiary)
      return apiResponse(plans)
    }

    const pools = await prisma.objectStoragePool.findMany({
      where: { provider: 'ovhcloud' },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { storageBuckets: true } } },
    })

    const result = pools.map((pool) => {
      const meta = pool.metadata as {
        projectId?: string
        regionName?: string
        credentialAccess?: string
      } | null
      return {
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
        userBucketCount: pool._count.storageBuckets,
        createdAt: pool.createdAt,
      }
    })

    return apiResponse(result)
  } catch (error) {
    logger.error('Failed to list OVHcloud Object Storage pools', error as Error)
    return apiError('Internal server error')
  }
}

/**
 * POST /api/admin/storage/ovhcloud
 * Provisions a new OVHcloud Object Storage pool:
 *   1. Generates S3-compatible credentials for the chosen project.
 *   2. Saves an ObjectStoragePool record in the DB.
 *
 * Body: { projectId: string, regionName: string, label: string, tier?: 'standard' | 'high_performance' }
 *
 * OVH S3 endpoint pattern: s3.<regionName>.io.cloud.ovh.net
 */
export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const body = await req.json()
    const { projectId, regionName, label, tier } = body

    if (!projectId || typeof projectId !== 'string') {
      return apiError('projectId (string) is required', HTTP_STATUS.BAD_REQUEST)
    }
    if (!regionName || typeof regionName !== 'string') {
      return apiError(
        'regionName (string) is required',
        HTTP_STATUS.BAD_REQUEST
      )
    }
    if (!label?.trim()) {
      return apiError('label is required', HTTP_STATUS.BAD_REQUEST)
    }

    // Validate the region belongs to the project
    const regions = await listOVHRegions(projectId)
    const region = regions.find((r) => r.name === regionName)
    if (!region) {
      return apiError(
        'Region not found in this project',
        HTTP_STATUS.BAD_REQUEST
      )
    }
    if (region.status !== 'UP') {
      return apiError(
        `Region ${regionName} is not currently available (status: ${region.status})`,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Generate S3-compatible credentials for the project
    const creds = await createOVHStorageCredentials(projectId)
    logger.info(
      `[Admin] Created OVHcloud S3 credentials for project ${projectId}`
    )

    // OVH S3-compatible endpoint for this region
    const s3Hostname = `s3.${regionName.toLowerCase()}.io.cloud.ovh.net`

    const pool = await prisma.objectStoragePool.create({
      data: {
        provider: 'ovhcloud',
        externalId: `${projectId}/${regionName}`,
        label: label.trim(),
        region: regionName,
        s3Hostname,
        s3AccessKey: creds.access,
        s3SecretKey: creds.secret,
        tier: tier?.trim() || 'standard',
        status: 'active',
        metadata: {
          projectId,
          regionName,
          credentialAccess: creds.access,
        },
      },
    })

    logger.info(
      `[Admin] Provisioned OVHcloud Object Storage pool ${pool.id} (project: ${projectId}, region: ${regionName})`
    )

    return apiResponse({
      id: pool.id,
      externalId: pool.externalId,
      label: pool.label,
      region: pool.region,
      projectId,
      regionName,
      tier: pool.tier,
      status: pool.status,
      s3Hostname: pool.s3Hostname,
      s3AccessKey: `${pool.s3AccessKey.slice(0, 6)}••••`,
    })
  } catch (error) {
    logger.error(
      'Failed to provision OVHcloud Object Storage pool',
      error as Error
    )
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
