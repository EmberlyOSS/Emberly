import { requireAuth } from '@/packages/lib/auth/api-auth'
import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { removeSquadDomain } from '@/packages/lib/nexium/squads'

/** DELETE /api/discovery/squads/:id/domains/:domainId — remove a domain (owner only) */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; domainId: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id, domainId } = await params
  try {
    await removeSquadDomain(id, user.id, domainId)
    return apiResponse({ success: true })
  } catch (err: any) {
    if (err.message === 'Squad not found') return apiError('Squad not found or access denied', HTTP_STATUS.NOT_FOUND)
    if (err.message === 'Domain not found') return apiError('Domain not found', HTTP_STATUS.NOT_FOUND)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
