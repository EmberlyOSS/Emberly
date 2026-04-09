import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import { redirect } from 'next/navigation'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://embrly.ca'

/** GET /api/discovery/invites/[token]/decline — decline an invite via email link */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) {
    const { token } = await params
    redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(`${BASE_URL}/api/discovery/invites/${token}/decline`)}`)
  }

  const { token } = await params

  const invite = await prisma.nexiumSquadInvite.findUnique({
    where: { token },
    include: {
      squad: { select: { id: true, name: true, ownerUserId: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  })

  if (!invite) redirect(`${BASE_URL}/dashboard/discovery?invite=invalid`)
  if (invite.userId !== user.id) redirect(`${BASE_URL}/dashboard/discovery?invite=forbidden`)
  if (invite.status !== 'PENDING') redirect(`${BASE_URL}/dashboard/discovery?invite=already-handled`)
  if (invite.expiresAt < new Date()) {
    await prisma.nexiumSquadInvite.update({ where: { token }, data: { status: 'EXPIRED' } })
    redirect(`${BASE_URL}/dashboard/discovery?invite=expired`)
  }

  await prisma.nexiumSquadInvite.update({ where: { token }, data: { status: 'DECLINED' } })

  // Notify squad owner
  const owner = await prisma.user.findUnique({
    where: { id: invite.squad.ownerUserId },
    select: { id: true, name: true, email: true },
  })
  if (owner?.email) {
    await events.emit('nexium.squad-invite-declined', {
      ownerId: owner.id,
      ownerEmail: owner.email,
      ownerName: owner.name ?? undefined,
      memberName: user.name ?? user.email ?? 'Someone',
      squadId: invite.squad.id,
      squadName: invite.squad.name,
    })
  }

  redirect(`${BASE_URL}/dashboard/discovery?invite=declined`)
}
