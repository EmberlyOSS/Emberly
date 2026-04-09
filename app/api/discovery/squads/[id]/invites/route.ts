import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://embrly.ca'
const INVITE_TTL_DAYS = 7

/** GET /api/discovery/squads/[id]/invites — list pending invites (owner only) */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params

  const squad = await prisma.nexiumSquad.findUnique({
    where: { id },
    select: { ownerUserId: true },
  })
  if (!squad) return apiError('Squad not found', HTTP_STATUS.NOT_FOUND)
  if (squad.ownerUserId !== user.id) return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)

  const invites = await prisma.nexiumSquadInvite.findMany({
    where: { squadId: id, status: 'PENDING' },
    include: {
      user: { select: { id: true, name: true, image: true, urlId: true, email: true } },
      invitedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return apiResponse({ invites })
}

/** POST /api/discovery/squads/[id]/invites — send an invite (owner only) */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { userId } = body as { userId?: string }

  if (!userId) return apiError('userId is required', HTTP_STATUS.BAD_REQUEST)

  const squad = await prisma.nexiumSquad.findUnique({
    where: { id },
    select: {
      ownerUserId: true,
      name: true,
      maxSize: true,
      status: true,
      _count: { select: { members: true } },
    },
  })
  if (!squad) return apiError('Squad not found', HTTP_STATUS.NOT_FOUND)
  if (squad.ownerUserId !== user.id) return apiError('Only the owner can invite members', HTTP_STATUS.FORBIDDEN)
  if (squad._count.members >= squad.maxSize) return apiError('Squad is full', HTTP_STATUS.BAD_REQUEST)
  if (squad.status !== 'FORMING' && squad.status !== 'ACTIVE') {
    return apiError('Squad is not accepting members', HTTP_STATUS.BAD_REQUEST)
  }

  // Check target user exists
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })
  if (!target) return apiError('User not found', HTTP_STATUS.NOT_FOUND)
  if (!target.email) return apiError('Target user has no email address', HTTP_STATUS.BAD_REQUEST)

  // Check not already a member
  const existingMember = await prisma.nexiumSquadMember.findUnique({
    where: { squadId_userId: { squadId: id, userId } },
  })
  if (existingMember) return apiError('User is already a member', HTTP_STATUS.CONFLICT)

  // Check no pending invite already exists — upsert to reset expiry if declined/expired
  const existingInvite = await prisma.nexiumSquadInvite.findUnique({
    where: { squadId_userId: { squadId: id, userId } },
  })
  if (existingInvite?.status === 'PENDING') {
    return apiError('A pending invite already exists for this user', HTTP_STATUS.CONFLICT)
  }

  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

  const invite = await prisma.nexiumSquadInvite.upsert({
    where: { squadId_userId: { squadId: id, userId } },
    create: {
      squadId: id,
      userId,
      invitedById: user.id,
      expiresAt,
      status: 'PENDING',
    },
    update: {
      invitedById: user.id,
      expiresAt,
      status: 'PENDING',
    },
    include: {
      user: { select: { id: true, name: true, image: true, urlId: true } },
    },
  })

  const inviterUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  })

  // Fire invite email event
  await events.emit('nexium.squad-invite', {
    userId: target.id,
    email: target.email,
    name: target.name ?? undefined,
    squadId: id,
    squadName: squad.name,
    inviterName: inviterUser?.name ?? 'Someone',
    inviteUrl: `${BASE_URL}/api/discovery/invites/${invite.token}/accept`,
    declineUrl: `${BASE_URL}/api/discovery/invites/${invite.token}/decline`,
  })

  return apiResponse({ invite }, HTTP_STATUS.CREATED)
}
