import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import {
  backfillPasswordHistory,
  backfillUserPasswordHistory,
  getPasswordHistoryCoverageStats,
} from '@/packages/lib/security/backfill-password-history'

/**
 * Admin endpoint for password history backfilling
 * 
 * GET: Check coverage statistics
 * POST: Backfill missing password histories
 * 
 * Requires admin role
 */

export async function GET(_req: Request) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    // Get statistics
    const stats = await getPasswordHistoryCoverageStats()

    return apiResponse({
      message: 'Password history coverage statistics',
      data: stats,
    })
  } catch (error) {
    console.error('Failed to get password history stats:', error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    const json = await req.json()
    const { action, limit, userId } = json

    if (!action) {
      return apiError('Missing required field: action', HTTP_STATUS.BAD_REQUEST)
    }

    // Backfill all users without history
    if (action === 'backfill-all') {
      const result = await backfillPasswordHistory(limit || 100)

      return apiResponse({
        message: 'Password history backfill completed',
        data: result,
      })
    }

    // Backfill specific user
    if (action === 'backfill-user') {
      if (!userId) {
        return apiError('Missing required field: userId', HTTP_STATUS.BAD_REQUEST)
      }

      const wasAdded = await backfillUserPasswordHistory(userId)

      return apiResponse({
        message: wasAdded
          ? 'Password added to history'
          : 'Password already in history',
        data: { userId, wasAdded },
      })
    }

    return apiError('Invalid action', HTTP_STATUS.BAD_REQUEST)
  } catch (error) {
    console.error('Failed to backfill password history:', error)
    return apiError(
      error instanceof Error ? error.message : 'Internal server error',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
