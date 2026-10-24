const DISCORD_WEBHOOK =
  /^https:\/\/(?:(?:ptb|canary)\.)?(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/

export function isDiscordWebhookUrl(url: string) {
  return DISCORD_WEBHOOK.test(url.trim())
}

export interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  color?: number
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  footer?: { text: string }
  timestamp?: string
}

export async function notifyDiscord(options: {
  webhookUrl: string
  content?: string
  embeds?: DiscordEmbed[]
}): Promise<boolean> {
  if (!options.webhookUrl) return false

  try {
    const res = await fetch(options.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: options.content,
        embeds: options.embeds,
        allowed_mentions: { parse: [] },
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      // 401/404 mean the webhook was deleted or the URL is wrong
      console.error(
        `[discord-webhook] Discord rejected the message: ${res.status} ${await res.text().catch(() => '')}`.slice(
          0,
          500
        )
      )
    }
    return res.ok
  } catch (err) {
    console.error('[discord-webhook] POST failed', err)
    return false
  }
}
