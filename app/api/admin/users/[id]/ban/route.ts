import { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'

const BanSchema = z.object({
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be at most 500 characters'),
  type: z.enum(['temporary', 'permanent']),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: admin, response: authResponse } = await requireAdmin()
  if (authResponse) return authResponse

  const { id: targetId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON body', HTTP_STATUS.BAD_REQUEST)
  }

  const parsed = BanSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)
  }

  const { reason, type, expiresAt, notes: _notes } = parsed.data

  // Validate expiresAt for temporary bans
  if (type === 'temporary') {
    if (!expiresAt) {
      return apiError('expiresAt is required for temporary bans', HTTP_STATUS.BAD_REQUEST)
    }
    const expiresDate = new Date(expiresAt)
    if (isNaN(expiresDate.getTime()) || expiresDate <= new Date()) {
      return apiError('expiresAt must be a valid future date', HTTP_STATUS.BAD_REQUEST)
    }
  }

  const expiresDate = expiresAt ? new Date(expiresAt) : null

  // Fetch target user
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!targetUser) {
    return apiError('User not found', HTTP_STATUS.NOT_FOUND)
  }

  // Cannot ban admins or superadmins
  if (targetUser.role === 'ADMIN' || targetUser.role === 'SUPERADMIN') {
    return apiError('Cannot ban admin or superadmin users', HTTP_STATUS.FORBIDDEN)
  }

  // Apply ban and create record in a transaction
  const banRecord = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetId },
      data: {
        bannedAt: new Date(),
        banReason: reason,
        banType: type,
        banExpiresAt: expiresDate,
      },
    })

    return tx.userBan.create({
      data: {
        userId: targetId,
        issuedById: admin.id,
        reason,
        type,
        expiresAt: expiresDate,
      },
    })
  })

  await events.emit('admin.user-banned', {
    adminId: admin.id,
    adminName: admin.name ?? '',
    targetId: targetUser.id,
    targetName: targetUser.name ?? '',
    targetEmail: targetUser.email ?? '',
    banType: type,
    reason,
    expiresAt: expiresDate ?? undefined,
  })

  return apiResponse(banRecord)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: admin, response: authResponse } = await requireAdmin()
  if (authResponse) return authResponse

  const { id: targetId } = await params

  let reason: string | undefined
  try {
    const body = await req.json()
    reason = typeof body?.reason === 'string' ? body.reason : undefined
  } catch {
    // reason is optional; ignore parse errors
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, email: true, bannedAt: true },
  })

  if (!targetUser) {
    return apiError('User not found', HTTP_STATUS.NOT_FOUND)
  }

  if (!targetUser.bannedAt) {
    return apiError('User is not currently banned', HTTP_STATUS.BAD_REQUEST)
  }

  // Lift ban and update most recent UserBan record in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetId },
      data: {
        bannedAt: null,
        banReason: null,
        banType: null,
        banExpiresAt: null,
      },
    })

    // Update the most recent active ban record
    const latestBan = await tx.userBan.findFirst({
      where: { userId: targetId, liftedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    if (latestBan) {
      await tx.userBan.update({
        where: { id: latestBan.id },
        data: {
          liftedAt: new Date(),
          liftedById: admin.id,
          liftReason: reason ?? null,
        },
      })
    }
  })

  await events.emit('admin.user-unbanned', {
    adminId: admin.id,
    adminName: admin.name ?? '',
    targetId: targetUser.id,
    targetName: targetUser.name ?? '',
    targetEmail: targetUser.email ?? '',
    reason,
  })

  return apiResponse({ success: true })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authResponse } = await requireAdmin()
  if (authResponse) return authResponse

  const { id: targetId } = await params

  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      bannedAt: true,
      banReason: true,
      banType: true,
      banExpiresAt: true,
    },
  })

  if (!targetUser) {
    return apiError('User not found', HTTP_STATUS.NOT_FOUND)
  }

  const latestBan = await prisma.userBan.findFirst({
    where: { userId: targetId },
    orderBy: { createdAt: 'desc' },
    include: {
      issuedBy: { select: { id: true, name: true, email: true } },
    },
  })

  return apiResponse({
    isBanned: !!targetUser.bannedAt,
    bannedAt: targetUser.bannedAt,
    banReason: targetUser.banReason,
    banType: targetUser.banType,
    banExpiresAt: targetUser.banExpiresAt,
    latestBan,
  })
}
