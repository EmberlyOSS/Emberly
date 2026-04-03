import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { getOpportunity, updateOpportunity, deleteOpportunity } from '@/packages/lib/nexium'
import { UpdateOpportunitySchema } from '@/packages/types/dto/nexium'

/** GET /api/discovery/opportunities/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const opp = await getOpportunity(id)
  if (!opp) return apiError('Opportunity not found', HTTP_STATUS.NOT_FOUND)
  return apiResponse(opp)
}

/** PUT /api/discovery/opportunities/[id] */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const body = await req.json()
  const parsed = UpdateOpportunitySchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  try {
    const result = await updateOpportunity(id, user.id, parsed.data)
    return apiResponse(result)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to update opportunity', HTTP_STATUS.BAD_REQUEST)
  }
}

/** DELETE /api/discovery/opportunities/[id] */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  try {
    await deleteOpportunity(id, user.id)
    return apiResponse({ ok: true })
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to delete opportunity', HTTP_STATUS.BAD_REQUEST)
  }
}
