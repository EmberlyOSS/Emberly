import { createUserApiKey, listUserApiKeys } from '@/lib/api-keys'
import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { z } from 'zod'

const CreateKeySchema = z.object({
  name: z.string().min(1).max(64),
})

/** GET /api/profile/api-keys — list all API keys (prefix only) */
export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const keys = await listUserApiKeys(user!.id)
  return apiResponse({ keys })
}

/** POST /api/profile/api-keys — create a new API key (full key shown once) */
export async function POST(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const body = await req.json().catch(() => ({}))
  const parsed = CreateKeySchema.safeParse(body)
  if (!parsed.success)
    return apiError('name is required (max 64 chars)', HTTP_STATUS.BAD_REQUEST)

  try {
    const result = await createUserApiKey(user!.id, parsed.data.name)
    return apiResponse(result, HTTP_STATUS.CREATED)
  } catch (err: any) {
    if (err.message.startsWith('Maximum'))
      return apiError(err.message, HTTP_STATUS.UNPROCESSABLE_ENTITY)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
