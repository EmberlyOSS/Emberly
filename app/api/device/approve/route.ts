import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { authOptions } from '@/packages/lib/auth'
import { rateLimiter } from '@/packages/lib/cache/rate-limit'
import {
  DEVICE_CLIENTS,
  decideDeviceAuthorization,
  findPendingByUserCode,
} from '@/packages/lib/device-auth'

const Body = z.object({
  userCode: z.string().min(8).max(12),
  approve: z.boolean().optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id)
    return apiError('Sign in to continue', HTTP_STATUS.UNAUTHORIZED)

  const { allowed } = await rateLimiter.check(
    `device:approve:${session.user.id}`,
    20,
    600
  )
  if (!allowed)
    return apiError(
      'Too many attempts. Try again in a few minutes.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    )

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success)
    return apiError('Enter the code shown in the app', HTTP_STATUS.BAD_REQUEST)

  if (parsed.data.approve === undefined) {
    const pending = await findPendingByUserCode(parsed.data.userCode)
    if (!pending)
      return apiError(
        "That code isn't valid or has expired",
        HTTP_STATUS.NOT_FOUND
      )
    return apiResponse({
      app: DEVICE_CLIENTS[pending.clientId] ?? pending.clientId,
      deviceName: pending.deviceName,
    })
  }

  const result = await decideDeviceAuthorization(
    parsed.data.userCode,
    session.user.id,
    parsed.data.approve
  )
  if (!result)
    return apiError(
      "That code isn't valid or has expired",
      HTTP_STATUS.NOT_FOUND
    )
  return apiResponse({ status: result.status })
}
