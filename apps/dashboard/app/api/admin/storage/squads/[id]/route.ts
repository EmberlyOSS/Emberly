import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { loggers } from '@/lib/logger'

const logger = loggers.storage

interface Params {
  params: Promise<{ id: string }>
}

/** Assign or clear a storage bucket for a squad. Body: { bucketId: string | null } */
export async function PUT(req: Request, { params }: Params) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    const { id } = await params
    const body = await req.json()
    const bucketId = body?.bucketId ?? null

    const squad = await prisma.nexiumSquad.findUnique({ where: { id }, select: { id: true } })
    if (!squad) return apiError('Squad not found', HTTP_STATUS.NOT_FOUND)

    if (bucketId) {
      const bucket = await prisma.storageBucket.findUnique({ where: { id: bucketId }, select: { id: true } })
      if (!bucket) return apiError('Storage bucket not found', HTTP_STATUS.NOT_FOUND)
    }

    await prisma.nexiumSquad.update({
      where: { id },
      data: { storageBucketId: bucketId },
    })

    return apiResponse({ squadId: id, storageBucketId: bucketId })
  } catch (error) {
    logger.error('Failed to assign storage bucket to squad', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
