import { requireAuth } from '@/packages/lib/auth/api-auth'
import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { getSquadQuota } from '@/packages/lib/nexium/squads'
import { prisma } from '@/packages/lib/database/prisma'

/** GET /api/discovery/squads/:id/quota — get quota/plan info for a squad (any member) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params

  // Must be a member to view quota
  const membership = await prisma.nexiumSquadMember.findUnique({
    where: { squadId_userId: { squadId: id, userId: user.id } },
    select: { role: true },
  })
  if (!membership) return apiError('Access denied', HTTP_STATUS.FORBIDDEN)

  try {
    const quota = await getSquadQuota(id)
    return apiResponse(quota)
  } catch (err: any) {
    if (err.message === 'Squad not found') return apiError('Squad not found', HTTP_STATUS.NOT_FOUND)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
