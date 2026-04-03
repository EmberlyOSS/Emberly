import { requireAuth } from '@/packages/lib/auth/api-auth'
import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { revokeApiKey } from '@/packages/lib/nexium/squads'

/** DELETE /api/discovery/squads/:id/keys/:keyId — revoke an API key (owner only) */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id, keyId } = await params
  try {
    await revokeApiKey(id, user.id, keyId)
    return apiResponse({ success: true })
  } catch (err: any) {
    if (err.message === 'Squad not found') return apiError('Squad not found or access denied', HTTP_STATUS.NOT_FOUND)
    if (err.message === 'API key not found') return apiError('API key not found', HTTP_STATUS.NOT_FOUND)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
