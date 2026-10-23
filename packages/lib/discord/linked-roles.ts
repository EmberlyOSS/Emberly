/**
 * Discord linked roles for the Emberly app.
 *
 * The Emberly bot registers the requirements with Discord on startup
 * (emberly-bot/src/lib/linkedRoles.ts); this pushes each member's values when
 * they connect. Keys here must match the bot's list. Values are a snapshot:
 * members connect again to refresh them.
 */
import { env } from '@/packages/lib/config/env'
import { prisma } from '@/packages/lib/database/prisma'

export const LINKED_ROLE_KEYS = {
  account: 'account',
  filesUploaded: 'files_uploaded',
  memberSince: 'member_since',
} as const

const DISCORD_API = 'https://discord.com/api/v10'

/**
 * The OAuth app must be the same Discord application as the Emberly bot,
 * because role connections belong to the application that registered them.
 */
export function linkedRolesClient() {
  return {
    clientId:
      process.env.DISCORD_LINKED_ROLES_CLIENT_ID || env.DISCORD_OAUTH_CLIENT_ID,
    clientSecret:
      process.env.DISCORD_LINKED_ROLES_CLIENT_SECRET ||
      env.DISCORD_OAUTH_CLIENT_SECRET,
  }
}

export function linkedRolesRedirectUri(baseUrl: string) {
  return `${baseUrl}/api/discord/linked-roles/callback`
}

export async function exchangeLinkedRolesCode(code: string, baseUrl: string) {
  const { clientId, clientSecret } = linkedRolesClient()
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: linkedRolesRedirectUri(baseUrl),
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string
    error?: string
  }
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Discord token exchange failed: ${data.error ?? res.status}`
    )
  }
  return data.access_token
}

/** Push the user's current values to Discord for the authorizing member */
export async function pushLinkedRoles(userId: string, accessToken: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      urlId: true,
      vanityId: true,
      createdAt: true,
      _count: { select: { files: true } },
    },
  })
  if (!user) throw new Error('User not found')

  const { clientId } = linkedRolesClient()
  const res = await fetch(
    `${DISCORD_API}/users/@me/applications/${clientId}/role-connection`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform_name: 'Emberly',
        platform_username: user.vanityId ?? user.name ?? user.urlId,
        metadata: {
          [LINKED_ROLE_KEYS.account]: 1,
          [LINKED_ROLE_KEYS.filesUploaded]: user._count.files,
          [LINKED_ROLE_KEYS.memberSince]: user.createdAt.toISOString(),
        },
      }),
      signal: AbortSignal.timeout(10_000),
    }
  )
  if (!res.ok) {
    throw new Error(
      `Discord rejected the role connection: ${res.status} ${await res.text().catch(() => '')}`
    )
  }
}
