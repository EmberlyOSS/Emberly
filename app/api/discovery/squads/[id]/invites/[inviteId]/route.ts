import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'

/** DELETE /api/discovery/squads/[id]/invites/[inviteId] — revoke a pending invite (owner only) */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id, inviteId } = await params

  const squad = await prisma.nexiumSquad.findUnique({
    where: { id },
    select: { ownerUserId: true },
  })
  if (!squad) return apiError('Squad not found', HTTP_STATUS.NOT_FOUND)
  if (squad.ownerUserId !== user.id) return apiError('Only the owner can revoke invites', HTTP_STATUS.FORBIDDEN)

  const invite = await prisma.nexiumSquadInvite.findFirst({
    where: { id: inviteId, squadId: id },
  })
  if (!invite) return apiError('Invite not found', HTTP_STATUS.NOT_FOUND)
  if (invite.status !== 'PENDING') return apiError('Invite is no longer pending', HTTP_STATUS.BAD_REQUEST)

  await prisma.nexiumSquadInvite.delete({ where: { id: inviteId } })

  return apiResponse({ ok: true })
}
