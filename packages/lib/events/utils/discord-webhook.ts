export async function notifyDiscord(options: {
  webhookUrl: string
  content?: string
  embeds?: Array<{
    title?: string
    description?: string
    color?: number
    fields?: Array<{ name: string; value: string; inline?: boolean }>
  }>
}): Promise<void> {
  if (!options.webhookUrl) return

  try {
    await fetch(options.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: options.content,
        embeds: options.embeds,
      }),
    })
  } catch (err) {
    console.error('[discord-webhook] POST failed', err)
  }
}
