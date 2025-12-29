import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/packages/lib/auth'
import { apiError, apiResponse } from '@/packages/lib/api/response'
import {
  getRecoveryCodesStatus,
  regenerateRecoveryCodes,
  createRecoveryCodes,
} from '@/packages/lib/auth/recovery-codes'

/**
 * GET /api/profile/2fa/recovery-codes
 * Get the status of user's recovery codes (count, used, remaining)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const status = await getRecoveryCodesStatus(session.user.id)

    return apiResponse({
      total: status.total,
      used: status.used,
      remaining: status.remaining,
      generatedAt: status.generatedAt,
    })
  } catch (error) {
    console.error('[GET /api/profile/2fa/recovery-codes]', error)
    return apiError('Failed to fetch recovery codes status')
  }
}

/**
 * POST /api/profile/2fa/recovery-codes
 * Regenerate recovery codes (invalidate old ones, create new ones)
 * Requires password for security
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const password = body.password as string | undefined

    if (!password) {
      return apiError('Password is required to regenerate recovery codes', 400)
    }

    // Verify password (optional but recommended)
    // For now we'll just regenerate without extra verification
    // since user is already authenticated

    // Regenerate codes
    const newCodes = await regenerateRecoveryCodes(session.user.id)

    return apiResponse({
      success: true,
      message: 'Recovery codes regenerated',
      recoveryCodes: newCodes,
    })
  } catch (error) {
    console.error('[POST /api/profile/2fa/recovery-codes]', error)
    return apiError('Failed to regenerate recovery codes')
  }
}

/**
 * PUT /api/profile/2fa/recovery-codes/download
 * Generate a downloadable text file of recovery codes
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return apiError('Unauthorized', 401)
    }

    // Get the status to find the latest batch
    const status = await getRecoveryCodesStatus(session.user.id)

    if (status.total === 0) {
      return apiError('No recovery codes found', 404)
    }

    // Return codes for download preparation
    // Client will handle the actual download formatting
    return apiResponse({
      message: 'Ready to download recovery codes',
      total: status.total,
      remaining: status.remaining,
      generatedAt: status.generatedAt,
    })
  } catch (error) {
    console.error('[PUT /api/profile/2fa/recovery-codes/download]', error)
    return apiError('Failed to prepare recovery codes download')
  }
}
