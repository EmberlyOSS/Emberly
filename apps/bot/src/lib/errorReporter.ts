/**
 * Error Reporter — logs command/interaction errors to the console and
 * optionally forwards them to a designated Discord text channel.
 *
 * Usage:
 *   1. Call `init(client)` once the bot is ready (from ready.ts).
 *   2. Call `reportCommandError(err, ctx)` anywhere an error needs reporting.
 *
 * Configure the target channel via ERROR_LOG_CHANNEL_ID in .env.
 */

import { Client, EmbedBuilder, TextChannel } from 'discord.js'
import { logger } from './logger'

let _client: Client | null = null

export function init(client: Client): void {
  _client = client
}

export interface ErrorContext {
  command?: string
  userId?: string
  guildId?: string | null
  channelId?: string | null
  extra?: string
}

/**
 * Report an error: always logs to console, optionally sends to the
 * Discord error channel configured by ERROR_LOG_CHANNEL_ID.
 */
export async function reportCommandError(err: unknown, ctx: ErrorContext = {}): Promise<void> {
  const error = err instanceof Error ? err : new Error(String(err))

  // Always log to console
  logger.error(`Command error${ctx.command ? ` in /${ctx.command}` : ''}`, {
    context: 'CommandError',
    error,
    userId: ctx.userId,
    guildId: ctx.guildId ?? undefined,
  })

  const channelId = process.env.ERROR_LOG_CHANNEL_ID
  if (!channelId || !_client) return

  try {
    const channel = await _client.channels.fetch(channelId)
    if (!channel || !channel.isTextBased()) return

    const userField = ctx.userId ? `<@${ctx.userId}> (\`${ctx.userId}\`)` : 'Unknown'
    const guildField = ctx.guildId ? `\`${ctx.guildId}\`` : 'DM / Unknown'
    const stack = error.stack?.slice(0, 1000) ?? 'No stack trace'
    const message = error.message.slice(0, 1000)

    const embed = new EmbedBuilder()
      .setColor(0xff3333)
      .setTitle('⚠️ Command Error')
      .addFields(
        { name: 'Command', value: ctx.command ? `\`/${ctx.command}\`` : 'Unknown', inline: true },
        { name: 'User', value: userField, inline: true },
        { name: 'Guild', value: guildField, inline: true },
        { name: 'Error', value: `\`\`\`\n${message}\n\`\`\`` },
        { name: 'Stack Trace', value: `\`\`\`\n${stack}\n\`\`\`` },
      )
      .setTimestamp()
      .setFooter({ text: '\u00a9Copyright 2026 embrly.ca' })

    if (ctx.extra) embed.addFields({ name: 'Extra', value: ctx.extra })

    await (channel as TextChannel).send({ embeds: [embed] })
  } catch (sendErr) {
    // Don't throw — error reporting must never crash the bot
    logger.error('Failed to send error report to Discord channel', {
      context: 'ErrorReporter',
      error: sendErr,
    })
  }
}
