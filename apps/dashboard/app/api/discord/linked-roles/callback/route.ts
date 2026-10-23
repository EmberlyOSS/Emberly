import { appUrl } from '@/lib/config/env'
import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth'
import {
  exchangeLinkedRolesCode,
  pushLinkedRoles,
} from '@/lib/discord/linked-roles'
import { loggers } from '@/lib/logger'

const logger = loggers.users
const STATE_COOKIE = 'discord_linked_roles_state'

/**
 * GET /api/discord/linked-roles/callback
 * Discord redirects here after the member authorizes; pushes their Emberly
 * values so they can claim linked roles.
 */
export async function GET(request: NextRequest) {
  const baseUrl = appUrl()
  const done = (status: string) => {
    const response = NextResponse.redirect(
      new URL(`/discord/linked-roles?status=${status}`, baseUrl)
    )
    response.cookies.delete(STATE_COOKIE)
    return response
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    const login = new URL('/auth/login', baseUrl)
    login.searchParams.set('callbackUrl', '/api/discord/linked-roles')
    return NextResponse.redirect(login)
  }

  const { searchParams } = request.nextUrl
  const state = searchParams.get('state')
  if (!state || state !== request.cookies.get(STATE_COOKIE)?.value) {
    return done('expired')
  }
  if (searchParams.get('error')) return done('cancelled')

  const code = searchParams.get('code')
  if (!code) return done('error')

  try {
    const accessToken = await exchangeLinkedRolesCode(code, baseUrl)
    await pushLinkedRoles(session.user.id, accessToken)
    return done('connected')
  } catch (error) {
    logger.error('Discord linked roles connect failed', error as Error, {
      userId: session.user.id,
    })
    return done('error')
  }
}
