import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { exchangeDeviceCode } from '@/packages/lib/device-auth'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.users
const Body = z.object({ deviceCode: z.string().min(20) })

const STATUS: Record<string, number> = {
  pending: HTTP_STATUS.ACCEPTED,
  denied: HTTP_STATUS.FORBIDDEN,
  expired: HTTP_STATUS.GONE,
  invalid: HTTP_STATUS.BAD_REQUEST,
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success)
    return apiError('deviceCode is required', HTTP_STATUS.BAD_REQUEST)

  try {
    const result = await exchangeDeviceCode(parsed.data.deviceCode)
    if (result.status !== 'approved') {
      return apiResponse({ status: result.status }, STATUS[result.status])
    }
    logger.info('Desktop app signed in', { userId: result.user.id })
    return apiResponse(result)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Maximum')) {
      return apiError(
        `${error.message}. Remove an unused key in Profile → API, then try again.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY
      )
    }
    logger.error('Device code exchange failed', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
