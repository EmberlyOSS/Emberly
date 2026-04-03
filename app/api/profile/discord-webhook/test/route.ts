import { z } from 'zod'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { notifyDiscord } from '@/packages/lib/events/utils/discord-webhook'

const testSchema = z.object({
  webhookUrl: z.string().url().optional(),
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
      return apiError('No Discord webhook URL configured', HTTP_STATUS.BAD_REQUEST)
    }

    await notifyDiscord({
      webhookUrl,
      embeds: [
        {
          title: '✅ Discord Notifications Connected',
          description: 'Your Emberly Discord webhook is configured and ready.',
          color: 0x22c55e,
          fields: [
            {
              name: 'Account',
              value: user.email || user.id,
              inline: true,
            },
            {
              name: 'Time',
              value: new Date().toISOString(),
              inline: true,
            },
          ],
        },
      ],
    })

    return apiResponse({ success: true })
  } catch {
    return apiError('Failed to send test notification', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
