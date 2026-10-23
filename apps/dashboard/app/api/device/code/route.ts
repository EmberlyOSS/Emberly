import { appUrl } from '@/lib/config/env'
import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { rateLimiter } from '@/lib/cache/rate-limit'
import {
  DEVICE_CLIENTS,
  DEVICE_CODE_TTL_SECONDS,
  POLL_INTERVAL_SECONDS,
  createDeviceAuthorization,
} from '@/lib/device-auth'

const Body = z.object({
  clientId: z.string(),
  deviceName: z.string().trim().min(1).max(40),
})

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const { allowed } = await rateLimiter.check(`device:code:${ip}`, 10, 600)
  if (!allowed)
    return apiError(
      'Too many sign-in attempts. Try again in a few minutes.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    )

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success || !DEVICE_CLIENTS[parsed.data.clientId]) {
    return apiError('Unknown app', HTTP_STATUS.BAD_REQUEST)
  }

  const { deviceCode, userCode } = await createDeviceAuthorization(
    parsed.data.clientId,
    parsed.data.deviceName
  )
  const base = (
    appUrl()
  ).replace(/\/$/, '')

  return apiResponse({
    deviceCode,
    userCode,
    verificationUri: `${base}/activate`,
    verificationUriComplete: `${base}/activate?code=${userCode}`,
    expiresIn: DEVICE_CODE_TTL_SECONDS,
    interval: POLL_INTERVAL_SECONDS,
  })
}
