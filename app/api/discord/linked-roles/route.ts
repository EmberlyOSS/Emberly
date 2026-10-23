import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/packages/lib/auth'
import {
  linkedRolesClient,
  linkedRolesRedirectUri,
} from '@/packages/lib/discord/linked-roles'

const STATE_COOKIE = 'discord_linked_roles_state'

/**
 * GET /api/discord/linked-roles
 * Linked Roles Verification URL for the Emberly Discord app. Members land here
 * from Discord (server menu → Linked Roles) or the mod bot's /roles button.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://embrly.ca'

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    const login = new URL('/auth/login', baseUrl)
    login.searchParams.set('callbackUrl', '/api/discord/linked-roles')
    return NextResponse.redirect(login)
  }

  const { clientId } = linkedRolesClient()
  if (!clientId) {
    return NextResponse.redirect(
      new URL('/discord/linked-roles?status=unavailable', baseUrl)
    )
  }

  const state = crypto.randomUUID()
  const response = NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: linkedRolesRedirectUri(baseUrl),
      response_type: 'code',
      scope: 'role_connections.write identify',
      prompt: 'consent',
      state,
    })}`
  )
  response.cookies.set(STATE_COOKIE, state, {
    maxAge: 300,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  return response
}
