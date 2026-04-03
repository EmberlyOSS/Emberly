import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { sessionCache } from '@/packages/lib/cache/session-cache'

const ALLOWED_PROVIDERS = ['github', 'discord'] as const

/**
 * POST /api/profile/avatar/linked
 * Body: { provider: "github" | "discord" }
 *
 * Resolves the avatar URL from the user's linked account (GitHub avatar or Discord avatar)
 * and sets it as their Emberly profile picture.
 *
 * For Discord, we also resolve avatar decorations via the providerData field.
 */
export async function POST(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const body = await req.json().catch(() => ({}))
  const provider = body?.provider as string

  if (!ALLOWED_PROVIDERS.includes(provider as (typeof ALLOWED_PROVIDERS)[number])) {
    return apiError('provider must be "github" or "discord"', HTTP_STATUS.BAD_REQUEST)
  }

  const linkedAccount = await prisma.linkedAccount.findFirst({
    where: { userId: user.id, provider },
    select: { providerUserId: true, providerUsername: true, providerData: true },
  })

  if (!linkedAccount) {
    return apiError(`No ${provider} account linked`, HTTP_STATUS.NOT_FOUND)
  }

  let avatarUrl: string | null = null
  const pd = linkedAccount.providerData as Record<string, any> | null

  if (provider === 'github') {
    // GitHub avatar URL pattern
    if (pd?.avatar) {
      avatarUrl = pd.avatar as string
    } else if (linkedAccount.providerUserId) {
      avatarUrl = `https://avatars.githubusercontent.com/u/${linkedAccount.providerUserId}?v=4`
    }
  } else if (provider === 'discord') {
    const discordId = linkedAccount.providerUserId
    const avatarHash = pd?.avatar as string | undefined | null

    if (discordId && avatarHash) {
      // Animated avatars (GIF) use the a_ prefix
      const ext = avatarHash.startsWith('a_') ? 'gif' : 'webp'
      avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}?size=256`
    } else if (discordId) {
      // Default Discord avatar based on discriminator / Pomelo
      const index = Number(BigInt(discordId) >> BigInt(22)) % 6
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${index}.png`
    }
  }

  if (!avatarUrl) {
    return apiError('Could not resolve avatar URL from linked account', HTTP_STATUS.UNPROCESSABLE_ENTITY)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { image: avatarUrl },
  })

  await sessionCache.invalidateUserSession(user.id)

  return apiResponse({ image: avatarUrl })
}
