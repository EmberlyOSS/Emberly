import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { getProfile, updateSkill, removeSkill } from '@/packages/lib/nexium'
import { UpdateSkillSchema } from '@/packages/types/dto/nexium'

/** PUT /api/discovery/skills/[id] — update a skill */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const body = await req.json()
  const parsed = UpdateSkillSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)

  const result = await updateSkill(id, profile.id, parsed.data)
  return apiResponse(result)
}

/** DELETE /api/discovery/skills/[id] — remove a skill */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)

  await removeSkill(id, profile.id)
  return apiResponse({ ok: true })
}
