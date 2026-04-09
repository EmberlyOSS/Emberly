import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'

/** GET /api/discovery/invites — list pending incoming invites for the current user */
export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const invites = await prisma.nexiumSquadInvite.findMany({
    where: { userId: user.id, status: 'PENDING' },
    include: {
      squad: {
        select: {
          id: true,
          name: true,
          urlId: true,
          description: true,
          avatarUrl: true,
          _count: { select: { members: true } },
          maxSize: true,
        },
      },
      invitedBy: { select: { id: true, name: true, image: true, urlId: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Filter out expired invites on the fly (they'll be cleaned up on token use)
  const now = new Date()
  const active = invites.filter((inv) => inv.expiresAt > now)

  return apiResponse({ invites: active })
}
