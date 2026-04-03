import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { joinSquad, leaveSquad, kickMember, setMemberRole } from '@/packages/lib/nexium'
import { SetMemberRoleSchema } from '@/packages/types/dto/nexium'

/** POST /api/discovery/squads/[id]/members
 *  body: {} → join
 *  body: { userId, role } → set role (owner only)
 *  body: { userId, kick: true } → kick member (owner only)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  if (body.kick === true) {
    const parsed = SetMemberRoleSchema.omit({ role: true }).safeParse(body)
    if (!parsed.success) return apiError('userId required', HTTP_STATUS.BAD_REQUEST)
    try {
      await kickMember(id, user.id, parsed.data.userId)
      return apiResponse({ ok: true })
    } catch (err: any) {
      return apiError(err.message ?? 'Failed to kick member', HTTP_STATUS.BAD_REQUEST)
    }
  }

  if (body.userId && body.role) {
    const parsed = SetMemberRoleSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)
    try {
      await setMemberRole(id, user.id, parsed.data.userId, parsed.data.role)
      return apiResponse({ ok: true })
    } catch (err: any) {
      return apiError(err.message ?? 'Failed to set role', HTTP_STATUS.BAD_REQUEST)
    }
  }

  // Default: join squad
  try {
    const member = await joinSquad(id, user.id)
    return apiResponse(member, HTTP_STATUS.CREATED)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to join squad', HTTP_STATUS.BAD_REQUEST)
  }
}

/** DELETE /api/discovery/squads/[id]/members — leave squad */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  try {
    await leaveSquad(id, user.id)
    return apiResponse({ ok: true })
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to leave squad', HTTP_STATUS.BAD_REQUEST)
  }
}
