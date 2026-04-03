import { NextRequest } from 'next/server'

import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authResponse } = await requireAdmin()
  if (authResponse) return authResponse

  const { id: targetId } = await params

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true },
  })

  if (!user) {
    return apiError('User not found', HTTP_STATUS.NOT_FOUND)
  }

  await prisma.user.update({
    where: { id: targetId },
    data: { isVerified: true },
  })

  return apiResponse({ success: true, verified: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authResponse } = await requireAdmin()
  if (authResponse) return authResponse

  const { id: targetId } = await params

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true },
  })

  if (!user) {
    return apiError('User not found', HTTP_STATUS.NOT_FOUND)
  }

  await prisma.user.update({
    where: { id: targetId },
    data: { isVerified: false },
  })

  return apiResponse({ success: true, verified: false })
}
