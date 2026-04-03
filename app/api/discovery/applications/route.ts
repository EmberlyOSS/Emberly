import { apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { getProfile, listMyApplications } from '@/packages/lib/nexium'

/** GET /api/discovery/applications — list the current user's own applications */
export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const profile = await getProfile(user.id)
  if (!profile) return apiResponse({ applications: [] })

  const applications = await listMyApplications(profile.id)
  return apiResponse({ applications })
}
