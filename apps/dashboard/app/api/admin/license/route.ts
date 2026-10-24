import { apiResponse } from '@/lib/api/response'
import { requireSuperAdmin } from '@/lib/auth/api-auth'
import { getLicense } from '@/lib/license'
import { checkInEnabled, getCheckInState } from '@/lib/license/check-in'

export async function GET(req: Request) {
  const { response } = await requireSuperAdmin(req)
  if (response) return response

  const status = getLicense()
  if (status.state === 'none' || status.state === 'invalid') {
    return apiResponse(status)
  }
  const { licensee, features, domains, expiresAt } = status.license
  const checkIn = checkInEnabled() ? await getCheckInState() : null
  return apiResponse({
    state: status.state,
    licensee,
    features,
    domains,
    expiresAt,
    checkIn: checkIn && {
      enabled: true,
      checkedAt: checkIn.checkedAt ?? null,
      failedAt: checkIn.failedAt ?? null,
      error: checkIn.error ?? null,
      status: checkIn.status ?? null,
      activations: checkIn.activations ?? null,
      maxActivations: checkIn.maxActivations ?? null,
      overLimit: !!checkIn.overLimit,
    },
  })
}
