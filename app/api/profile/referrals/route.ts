import { requireAuth } from '@/packages/lib/auth/api-auth'
import { NextResponse } from 'next/server'

import { getReferralStats, getReferralHistory, setCustomReferralCode } from '@/packages/lib/referrals'
import { prisma } from '@/packages/lib/database/prisma'

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuth(request)
    if (response) return response

    const searchParams = new URL(request.url).searchParams
    const action = searchParams.get('action')

    if (action === 'stats') {
      const stats = await getReferralStats(user.id)
      return NextResponse.json(stats)
    }

    if (action === 'history') {
      const history = await getReferralHistory(user.id)
      return NextResponse.json(history)
    }

    // Default: return referral code (don't auto-generate)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true },
    })
    return NextResponse.json({ referralCode: dbUser?.referralCode || null })
  } catch (error) {
    console.error('Referral API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuth(request)
    if (response) return response

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const result = await setCustomReferralCode(user.id, code)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Set referral code error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 400 }
    )
  }
}
