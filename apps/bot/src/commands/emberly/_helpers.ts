import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { reportCommandError } from '../../lib/errorReporter'
import { EmberlyAuthError } from '../../lib/emberlyApi'
import { BRAND_COLOR, ERROR_COLOR } from '../../lib/brand'

export const ACCENT = BRAND_COLOR
export const SITE = process.env.EMBERLY_API_URL?.replace(/\/$/, '') ?? 'https://embrly.ca'

/** Absolute links to pages on the Emberly site */
export const links = {
  uploadSettings: `${SITE}/me?tab=uploads`,
  dashboard: `${SITE}/dashboard`,
  domains: `${SITE}/dashboard/domains`,
  squads: `${SITE}/dashboard/squads`,
  discovery: `${SITE}/discovery`,
  profile: (username: string) => `${SITE}/user/${encodeURIComponent(username)}`,
  file: (urlPath: string) => `${SITE}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`,
  shortUrl: (code: string) => `${SITE}/u/${code}`,
  squad: (id: string) => `${SITE}/dashboard/squads/${id}`,
  /** Stored image paths (avatars) are site-relative */
  asset: (path: string | null | undefined) =>
    !path ? null : /^https?:\/\//.test(path) ? path : `${SITE}${path.startsWith('/') ? '' : '/'}${path}`,
}

export function notLinkedReply() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(ERROR_COLOR)
        .setTitle('🔗 Account not linked')
        .setDescription(
          `You haven't linked your Emberly account yet. To get started:\n\n` +
          `**1.** Open the **[Uploads tab](${links.uploadSettings})** on your profile.\n` +
          `**2.** Copy your **upload token** (or regenerate it).\n` +
          `**3.** Run \`/link token:<your token>\`. The reply is private, so only you see it.`
        )
        .setFooter({ text: 'Your token is private — never share it with anyone.' }),
    ],
  } as const
}

function expiredLinkReply() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(ERROR_COLOR)
        .setTitle('🔗 Link expired')
        .setDescription(
          `Emberly no longer accepts the token you linked, usually because it was regenerated.\n\n` +
          `Copy your current token from the **[Uploads tab](${links.uploadSettings})** and run \`/link\` again.`
        ),
    ],
  } as const
}

export function formatBytes(mb: number) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${mb.toFixed(2)} MB`
}

export function storageBar(used: number, quota: number | null) {
  if (!quota) return `${formatBytes(used)} used`
  const pct = Math.min(Math.round((used / quota) * 100), 100)
  const filled = Math.round(pct / 10)
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)
  return `${bar} ${pct}% — ${formatBytes(used)} / ${formatBytes(quota)}`
}

/** Discord rejects embed field values over 1024 characters */
export function clampField(value: string, max = 1024) {
  return value.length <= max ? value : value.slice(0, max - 1) + '…'
}

export function handleApiError(err: unknown, interaction?: ChatInputCommandInteraction) {
  // A rejected token is the user's to fix, not a bot error worth reporting
  if (err instanceof EmberlyAuthError) return expiredLinkReply()

  void reportCommandError(err, {
    command: interaction?.commandName,
    userId: interaction?.user.id,
    guildId: interaction?.guildId,
    channelId: interaction?.channelId,
  })

  const msg = (err as any)?.message ?? 'An unexpected error occurred.'
  return {
    embeds: [new EmbedBuilder().setColor(ERROR_COLOR).setTitle('Something went wrong').setDescription(msg)],
  }
}
