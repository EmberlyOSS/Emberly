import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { getProfile, addSkill, reorderSkills, replaceSkills } from '@/packages/lib/nexium'
import { SkillInputSchema, ReplaceSkillsSchema, ReorderSkillsSchema } from '@/packages/types/dto/nexium'
import { events } from '@/packages/lib/events'

/** GET /api/discovery/skills — list own skills */
export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)
  return apiResponse(profile.skills)
}

/** POST /api/discovery/skills — add a skill */
export async function POST(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const body = await req.json()

  // Support bulk replace: { skills: [...] }
  if (Array.isArray(body.skills)) {
    const parsed = ReplaceSkillsSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)
    const profile = await getProfile(user.id)
    if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)
    const result = await replaceSkills(profile.id, parsed.data.skills)

    void events.emit('nexium.skills-replaced', {
      userId: user.id,
      email: user.email!,
      count: parsed.data.skills.length,
    }).catch((err) => console.error('[Events] Failed to emit nexium.skills-replaced', err))

    return apiResponse(result)
  }

  // Support reorder: { orderedIds: [...] }
  if (Array.isArray(body.orderedIds)) {
    const parsed = ReorderSkillsSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)
    const profile = await getProfile(user.id)
    if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)
    await reorderSkills(profile.id, parsed.data.orderedIds)
    return apiResponse({ ok: true })
  }

  const parsed = SkillInputSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)

  try {
    const skill = await addSkill(profile.id, parsed.data)

    void events.emit('nexium.skill-added', {
      userId: user.id,
      email: user.email!,
      skillName: parsed.data.name,
    }).catch((err) => console.error('[Events] Failed to emit nexium.skill-added', err))

    return apiResponse(skill, HTTP_STATUS.CREATED)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to add skill', HTTP_STATUS.BAD_REQUEST)
  }
}
