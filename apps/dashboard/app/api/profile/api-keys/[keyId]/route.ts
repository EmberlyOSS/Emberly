import { requireAuth } from '@/lib/auth/api-auth'
import { apiError, apiResponse, HTTP_STATUS } from '@/lib/api/response'
import { revokeUserApiKey } from '@/lib/api-keys'

/** DELETE /api/profile/api-keys/:keyId — revoke an API key */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { keyId } = await params
  try {
    await revokeUserApiKey(user!.id, keyId)
    return apiResponse({ success: true })
  } catch (err: any) {
    if (err.message === 'API key not found') return apiError('API key not found', HTTP_STATUS.NOT_FOUND)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
