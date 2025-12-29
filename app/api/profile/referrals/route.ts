import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/packages/lib/auth'
import { getReferralStats, getReferralHistory, setCustomReferralCode } from '@/packages/lib/referrals'
import { prisma } from '@/packages/lib/database/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'stats') {
      const stats = await getReferralStats(session.user.id)
      return NextResponse.json(stats)
    }

    if (action === 'history') {
      const history = await getReferralHistory(session.user.id)
      return NextResponse.json(history)
    }

    // Default: return referral code (don't auto-generate)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true },
    })
    return NextResponse.json({ referralCode: user?.referralCode || null })
  } catch (error) {
    console.error('Referral API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const result = await setCustomReferralCode(session.user.id, code)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Set referral code error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 400 }
    )
  }
}
