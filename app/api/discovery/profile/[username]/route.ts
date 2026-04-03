import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { getProfileByUsername } from '@/packages/lib/nexium'

/** GET /api/discovery/profile/[username] — public profile lookup by username */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return apiError('Profile not found', HTTP_STATUS.NOT_FOUND)
  return apiResponse(profile)
}
