import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/api-auth'
import { events } from '@/lib/events'
import { loggers } from '@/lib/logger'

const logger = loggers.api

export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin(req)
    if (response) return response

    // Trigger a manual bucket sync
    await events.emit('storage.sync-buckets', {
      _trigger: 'manual',
    })

    logger.info('[Admin] Manual bucket sync triggered')

    return apiResponse({
      ok: true,
      message:
        'Bucket synchronization has been triggered. Check the logs for progress.',
    })
  } catch (error) {
    logger.error('Failed to trigger bucket sync', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
