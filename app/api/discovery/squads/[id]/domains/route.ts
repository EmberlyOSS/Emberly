import { z } from 'zod'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { apiError, apiResponse, HTTP_STATUS } from '@/packages/lib/api/response'
import { addSquadDomain, listSquadDomains } from '@/packages/lib/nexium/squads'

const AddDomainSchema = z.object({
  domain: z
    .string()
    .min(1)
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/, 'Invalid domain format'),
})

/** GET /api/discovery/squads/:id/domains — list domains (any member) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  try {
    const domains = await listSquadDomains(id, user.id)
    return apiResponse({ domains })
  } catch (err: any) {
    if (err.message === 'Not a squad member') return apiError('Access denied', HTTP_STATUS.FORBIDDEN)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

/** POST /api/discovery/squads/:id/domains — add a custom domain (owner only) */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const parsed = AddDomainSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message, HTTP_STATUS.BAD_REQUEST)

  try {
    const domain = await addSquadDomain(id, user.id, parsed.data.domain)
    return apiResponse({ domain }, HTTP_STATUS.CREATED)
  } catch (err: any) {
    if (err.message === 'Squad not found') return apiError('Squad not found or access denied', HTTP_STATUS.NOT_FOUND)
    if (err.message === 'Domain already registered') return apiError('Domain already registered', HTTP_STATUS.CONFLICT)
    if (err.message.includes('limit reached')) return apiError(err.message, HTTP_STATUS.UNPROCESSABLE_ENTITY)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
