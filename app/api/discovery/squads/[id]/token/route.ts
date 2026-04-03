import { requireAuth } from '@/packages/lib/auth/api-auth'
import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { getOrCreateUploadToken, rotateUploadToken } from '@/packages/lib/nexium/squads'

/** GET /api/discovery/squads/:id/token — fetch the squad's upload token (owner only) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  try {
    const token = await getOrCreateUploadToken(id, user.id)
    return apiResponse({ uploadToken: token })
  } catch (err: any) {
    if (err.message === 'Squad not found') return apiError('Squad not found or access denied', HTTP_STATUS.NOT_FOUND)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/** POST /api/discovery/squads/:id/token — rotate (regenerate) the upload token (owner only) */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  try {
    const token = await rotateUploadToken(id, user.id)
    return apiResponse({ uploadToken: token })
  } catch (err: any) {
    if (err.message === 'Squad not found') return apiError('Squad not found or access denied', HTTP_STATUS.NOT_FOUND)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
