import { NextResponse } from 'next/server'

import { checkSetupCompletion } from '@/lib/database/setup'
import { loggers } from '@/lib/logger'

const logger = loggers.startup

// Cache duration: 30 seconds for browser, 60 seconds for CDN
const CACHE_MAX_AGE = 30
const CACHE_S_MAXAGE = 60

export async function GET() {
  try {
    const completed = await checkSetupCompletion()

    // Only "completed" is safe to cache: setup never un-completes, but a
    // cached "incomplete" keeps bouncing users to /setup after it finishes
    return NextResponse.json(
      { completed },
      {
        headers: {
          'Cache-Control': completed
            ? `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_S_MAXAGE}, stale-while-revalidate=60`
            : 'no-store',
        },
      }
    )
  } catch (error) {
    logger.error('Setup check error:', error as Error)
    return NextResponse.json(
      { error: 'Could not reach the database' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
