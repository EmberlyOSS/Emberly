import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { addGrant, removeGrant, ALL_GRANTS, type Grant } from '@/lib/grants'
import { hasPermission, Permission, UserRole } from '@/lib/permissions'
import { loggers } from '@/lib/logger'

const logger = loggers.api.getChildLogger('admin-user-grants')

const GrantSchema = z.object({
  grant: z.enum(ALL_GRANTS as [Grant, ...Grant[]]),
})

/**
 * GET /api/admin/users/[id]/grants
 * Returns the grants currently held by the user.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: adminUser, response } = await requireAdmin()
    if (response) return response

    if (!hasPermission(adminUser.role as UserRole, Permission.VIEW_GRANTS)) {
      return apiError('Forbidden', HTTP_STATUS.FORBIDDEN)
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, grants: true },
    })
    if (!user) return apiError('User not found', HTTP_STATUS.NOT_FOUND)

    return apiResponse({ grants: [...new Set(user.grants)] })
  } catch (error) {
    logger.error('Error fetching user grants', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/**
 * POST /api/admin/users/[id]/grants
 * Body: { grant: string }
 * Awards a grant to the user (idempotent).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: adminUser, response } = await requireAdmin()
    if (response) return response

    if (!hasPermission(adminUser.role as UserRole, Permission.MANAGE_GRANTS)) {
      return apiError('Forbidden — superadmin only', HTTP_STATUS.FORBIDDEN)
    }

    const { id } = await params

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!user) return apiError('User not found', HTTP_STATUS.NOT_FOUND)

    const json = await req.json().catch(() => null)
    const parsed = GrantSchema.safeParse(json)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    await addGrant(id, parsed.data.grant)

    logger.info('Grant awarded by admin', {
      adminId: adminUser.id,
      userId: id,
      grant: parsed.data.grant,
    })

    return apiResponse({ success: true, grant: parsed.data.grant })
  } catch (error) {
    logger.error('Error awarding grant', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/**
 * DELETE /api/admin/users/[id]/grants
 * Body: { grant: string }
 * Revokes a grant from the user (idempotent).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: adminUser, response } = await requireAdmin()
    if (response) return response

    if (!hasPermission(adminUser.role as UserRole, Permission.MANAGE_GRANTS)) {
      return apiError('Forbidden — superadmin only', HTTP_STATUS.FORBIDDEN)
    }

    const { id } = await params

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!user) return apiError('User not found', HTTP_STATUS.NOT_FOUND)

    const json = await req.json().catch(() => null)
    const parsed = GrantSchema.safeParse(json)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)
    }

    await removeGrant(id, parsed.data.grant)

    logger.info('Grant revoked by admin', {
      adminId: adminUser.id,
      userId: id,
      grant: parsed.data.grant,
    })

    return apiResponse({ success: true, grant: parsed.data.grant })
  } catch (error) {
    logger.error('Error revoking grant', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
