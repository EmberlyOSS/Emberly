import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireSuperAdmin } from '@/lib/auth/api-auth'
import { getLicense, licenseKeySource, parseLicense } from '@/lib/license'
import {
  checkInEnabled,
  checkInNow,
  getCheckInState,
} from '@/lib/license/check-in'
import { saveLicenseKey } from '@/lib/license/store'

async function licenseInfo() {
  const source = licenseKeySource()
  const status = getLicense()
  if (status.state === 'none' || status.state === 'invalid') {
    return { ...status, source }
  }
  const { licensee, features, domains, expiresAt } = status.license
  const checkIn = checkInEnabled() ? await getCheckInState() : null
  return {
    state: status.state,
    source,
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
  }
}

export async function GET(req: Request) {
  const { response } = await requireSuperAdmin(req)
  if (response) return response
  return apiResponse(await licenseInfo())
}

export async function PUT(req: Request) {
  const { response } = await requireSuperAdmin(req)
  if (response) return response

  if (licenseKeySource() === 'env') {
    return apiError(
      'The license key is set with EMBERLY_LICENSE_KEY on the server',
      HTTP_STATUS.CONFLICT
    )
  }

  const body = (await req.json().catch(() => ({}))) as { key?: unknown }
  const key = typeof body.key === 'string' ? body.key.trim() : ''
  const parsed = parseLicense(key, { checkDomain: false })
  if (!('license' in parsed)) {
    const reason = 'reason' in parsed ? parsed.reason : 'No key given'
    return apiError(reason, HTTP_STATUS.BAD_REQUEST)
  }

  await saveLicenseKey(key)
  await checkInNow().catch(() => null)
  return apiResponse(await licenseInfo())
}

export async function DELETE(req: Request) {
  const { response } = await requireSuperAdmin(req)
  if (response) return response

  if (licenseKeySource() === 'env') {
    return apiError(
      'The license key is set with EMBERLY_LICENSE_KEY on the server',
      HTTP_STATUS.CONFLICT
    )
  }

  await saveLicenseKey(null)
  return apiResponse(await licenseInfo())
}
