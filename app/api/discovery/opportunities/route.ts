import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { listOpportunities, createOpportunity } from '@/packages/lib/nexium'
import { CreateOpportunitySchema } from '@/packages/types/dto/nexium'
import { events } from '@/packages/lib/events'

/** GET /api/discovery/opportunities — list open opportunities (public) or own (authed) */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const page = Number(url.searchParams.get('page') ?? '1')
  const limit = Number(url.searchParams.get('limit') ?? '20')
  const type = url.searchParams.get('type') ?? undefined
  const skill = url.searchParams.get('skill') ?? undefined
  const mine = url.searchParams.get('mine') === 'true'

  const { user, response } = mine ? await requireAuth(req) : { user: null, response: null }
  if (mine && response) return response

  const result = await listOpportunities({
    page,
    limit,
    type: type as any,
    skill,
    postedByUserId: mine && user ? user.id : undefined,
  })

  return apiResponse(result)
}

/** POST /api/discovery/opportunities — create an opportunity */
export async function POST(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const body = await req.json()
  const parsed = CreateOpportunitySchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  try {
    const opp = await createOpportunity(user.id, parsed.data)

    void events.emit('nexium.opportunity-created', {
      userId: user.id,
      email: user.email!,
      opportunityId: opp.id,
      title: parsed.data.title,
    }).catch((err) => console.error('[Events] Failed to emit nexium.opportunity-created', err))

    return apiResponse(opp, HTTP_STATUS.CREATED)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to create opportunity', HTTP_STATUS.BAD_REQUEST)
  }
}
