import { z } from 'zod'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { listApiKeys, createApiKey } from '@/packages/lib/nexium/squads'

const CreateKeySchema = z.object({
  name: z.string().min(1).max(64),
})

/** GET /api/discovery/squads/:id/keys — list API keys (any member, prefix only) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  try {
    const keys = await listApiKeys(id, user.id)
    return apiResponse({ keys })
  } catch (err: any) {
    if (err.message === 'Not a squad member') return apiError('Access denied', HTTP_STATUS.FORBIDDEN)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/** POST /api/discovery/squads/:id/keys — create a new API key (owner only, key shown once) */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const parsed = CreateKeySchema.safeParse(body)
  if (!parsed.success) return apiError('name is required (max 64 chars)', HTTP_STATUS.BAD_REQUEST)

  try {
    const result = await createApiKey(id, user.id, parsed.data.name)
    // Return 201 — the full key is only exposed here
    return apiResponse(result, HTTP_STATUS.CREATED)
  } catch (err: any) {
    if (err.message === 'Squad not found') return apiError('Squad not found or access denied', HTTP_STATUS.NOT_FOUND)
    if (err.message.startsWith('Maximum')) return apiError(err.message, HTTP_STATUS.UNPROCESSABLE_ENTITY)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
