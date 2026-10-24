import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { getBranding } from '@/lib/branding'
import {
  isDiscordWebhookUrl,
  notifyDiscord,
} from '@/lib/events/utils/discord-webhook'

const testSchema = z.object({
  webhookUrl: z.string().trim().refine(isDiscordWebhookUrl).optional(),
})

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) return response

    const body = await req.json().catch(() => ({}))
    const parsed = testSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Invalid webhook URL', HTTP_STATUS.BAD_REQUEST)
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { discordWebhookUrl: true },
    })

    const webhookUrl = parsed.data.webhookUrl || profile?.discordWebhookUrl

    if (!webhookUrl) {
      return apiError(
        'No Discord webhook URL configured',
        HTTP_STATUS.BAD_REQUEST
      )
    }
    if (!isDiscordWebhookUrl(webhookUrl)) {
      return apiError('Invalid webhook URL', HTTP_STATUS.BAD_REQUEST)
    }

    const { embedName } = await getBranding()
    const sent = await notifyDiscord({
      webhookUrl,
      embeds: [
        {
          title: 'Discord notifications connected',
          description: `Notifications from ${embedName} will be posted here.`,
          color: 0x22c55e,
          footer: { text: embedName },
          timestamp: new Date().toISOString(),
        },
      ],
    })
    if (!sent) {
      return apiError(
        "Discord didn't accept the message. Check the webhook URL.",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    return apiResponse({ success: true })
  } catch {
    return apiError('Failed to send test notification')
  }
}
