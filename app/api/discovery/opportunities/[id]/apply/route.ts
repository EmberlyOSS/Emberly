import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import {
  applyToOpportunity,
  withdrawApplication,
  listApplicationsForOpportunity,
  getProfile,
} from '@/packages/lib/nexium'
import { ApplySchema } from '@/packages/types/dto/nexium'

/** GET /api/discovery/opportunities/[id]/apply — list applications (poster only) */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  try {
    const apps = await listApplicationsForOpportunity(id, user.id)
    return apiResponse(apps)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to list applications', HTTP_STATUS.FORBIDDEN)
  }
}

/** POST /api/discovery/opportunities/[id]/apply — submit application */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = ApplySchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  const profile = await getProfile(user.id)
  if (!profile) return apiError('You need a Discovery profile to apply', HTTP_STATUS.BAD_REQUEST)

  try {
    const app = await applyToOpportunity(id, profile.id, parsed.data.message)
    return apiResponse(app, HTTP_STATUS.CREATED)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to apply', HTTP_STATUS.BAD_REQUEST)
  }
}

/** DELETE /api/discovery/opportunities/[id]/apply — withdraw application */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)

  try {
    await withdrawApplication(id, profile.id)
    return apiResponse({ ok: true })
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to withdraw application', HTTP_STATUS.BAD_REQUEST)
  }
}
