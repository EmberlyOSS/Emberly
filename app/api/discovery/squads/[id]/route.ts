import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { getSquad, updateSquad, disbandSquad } from '@/packages/lib/nexium'
import { UpdateSquadSchema } from '@/packages/types/dto/nexium'

/** GET /api/discovery/squads/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const squad = await getSquad(id)
  if (!squad) return apiError('Squad not found', HTTP_STATUS.NOT_FOUND)
  return apiResponse(squad)
}

/** PUT /api/discovery/squads/[id] */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const body = await req.json()
  const parsed = UpdateSquadSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  try {
    const result = await updateSquad(id, user.id, parsed.data)
    return apiResponse(result)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to update squad', HTTP_STATUS.BAD_REQUEST)
  }
}

/** DELETE /api/discovery/squads/[id] — disband */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  try {
    await disbandSquad(id, user.id)
    return apiResponse({ ok: true })
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to disband squad', HTTP_STATUS.BAD_REQUEST)
  }
}
