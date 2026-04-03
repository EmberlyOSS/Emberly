import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { getProfile, addSignal, reorderSignals } from '@/packages/lib/nexium'
import { SignalInputSchema, ReorderSignalsSchema } from '@/packages/types/dto/nexium'
import { events } from '@/packages/lib/events'

/** GET /api/discovery/signals — list own signals */
export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)
  return apiResponse(profile.signals)
}

/** POST /api/discovery/signals — add a signal (or reorder) */
export async function POST(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const body = await req.json()

  if (Array.isArray(body.orderedIds)) {
    const parsed = ReorderSignalsSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)
    const profile = await getProfile(user.id)
    if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)
    await reorderSignals(profile.id, parsed.data.orderedIds)
    return apiResponse({ ok: true })
  }

  const parsed = SignalInputSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)

  try {
    const signal = await addSignal(profile.id, parsed.data)

    void events.emit('nexium.signal-added', {
      userId: user.id,
      email: user.email!,
      signalType: parsed.data.type,
      signalTitle: parsed.data.title,
    }).catch((err) => console.error('[Events] Failed to emit nexium.signal-added', err))

    return apiResponse(signal, HTTP_STATUS.CREATED)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to add signal', HTTP_STATUS.BAD_REQUEST)
  }
}
