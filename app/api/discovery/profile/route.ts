import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { getProfile, createProfile, updateProfile, deleteProfile } from '@/packages/lib/nexium'
import { CreateProfileSchema, UpdateProfileSchema } from '@/packages/types/dto/nexium'
import { events } from '@/packages/lib/events'

/** GET /api/discovery/profile — fetch own Discovery profile */
export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)
  return apiResponse(profile)
}

/** POST /api/discovery/profile — create Discovery profile */
export async function POST(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const body = await req.json()
  const parsed = CreateProfileSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  try {
    const profile = await createProfile(user.id, parsed.data)

    void events.emit('nexium.profile-created', {
      userId: user.id,
      email: user.email!,
      profileId: profile.id,
    }).catch((err) => console.error('[Events] Failed to emit nexium.profile-created', err))

    return apiResponse(profile, HTTP_STATUS.CREATED)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to create profile', HTTP_STATUS.BAD_REQUEST)
  }
}

/** PUT /api/discovery/profile — update own Discovery profile */
export async function PUT(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const body = await req.json()
  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  try {
    const profile = await updateProfile(user.id, parsed.data)

    void events.emit('nexium.profile-updated', {
      userId: user.id,
      email: user.email!,
      fields: Object.keys(parsed.data),
    }).catch((err) => console.error('[Events] Failed to emit nexium.profile-updated', err))

    return apiResponse(profile)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to update profile', HTTP_STATUS.BAD_REQUEST)
  }
}

/** DELETE /api/discovery/profile — delete own Discovery profile */
export async function DELETE(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  try {
    await deleteProfile(user.id)

    void events.emit('nexium.profile-deleted', {
      userId: user.id,
      email: user.email!,
    }).catch((err) => console.error('[Events] Failed to emit nexium.profile-deleted', err))

    return apiResponse({ ok: true })
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to delete profile', HTTP_STATUS.BAD_REQUEST)
  }
}
