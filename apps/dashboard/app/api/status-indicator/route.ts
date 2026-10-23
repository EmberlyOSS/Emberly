import { NextResponse } from 'next/server'

import { getStatusSnapshot } from '@/lib/status-page'

// GET /api/status-indicator: current status page snapshot for the footer badge.
// Returns { configured: false } when no status page is set up.
export async function GET() {
  const snapshot = await getStatusSnapshot()
  return NextResponse.json(
    snapshot ? { configured: true, ...snapshot } : { configured: false },
    {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
    }
  )
}
