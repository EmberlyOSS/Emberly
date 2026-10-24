import { prisma } from '@emberly/db'

import { getBranding } from '@/lib/branding'
import { appUrl } from '@/lib/config/env'
import { getDiscordWebhook } from '@/lib/events/utils/discord-preferences'
import { notifyDiscord } from '@/lib/events/utils/discord-webhook'
import { loggers } from '@/lib/logger'
import type { EmailPreferences } from '@/types/dto/profile'

const logger = loggers.users.getChildLogger('notifications')

export type NotificationCategory = keyof EmailPreferences

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  'security',
  'account',
  'billing',
  'productUpdates',
  'marketing',
]

const DEFAULT_LINKS: Record<NotificationCategory, string> = {
  security: '/me?tab=security',
  account: '/me?tab=profile',
  billing: '/me?tab=billing',
  productUpdates: '/dashboard',
  marketing: '/dashboard',
}

const DISCORD_COLORS: Record<NotificationCategory, number> = {
  security: 0x3b82f6,
  account: 0xea580c,
  billing: 0xa855f7,
  productUpdates: 0x22c55e,
  marketing: 0x6366f1,
}

const KEEP_DAYS = 90
const MAX_TITLE = 200
const MAX_BODY = 1000

export interface NewNotification {
  userId: string
  category: NotificationCategory
  title: string
  body?: string | null
  link?: string | null
}

/**
 * Adds a notification to the user's in-app list, and posts it to their
 * Discord webhook when they want that category there. Never throws.
 */
export async function createNotification(notification: NewNotification) {
  const title = notification.title.slice(0, MAX_TITLE)
  const body = notification.body?.slice(0, MAX_BODY) || null
  const link = notification.link ?? DEFAULT_LINKS[notification.category]

  try {
    await prisma.notification.create({
      data: {
        userId: notification.userId,
        category: notification.category,
        title,
        body,
        link,
      },
    })
    if (Math.random() < 0.05) await pruneNotifications(notification.userId)
  } catch (error) {
    logger.warn('Could not create notification', {
      userId: notification.userId,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  await sendToDiscord(notification.userId, notification.category, {
    title,
    body,
    link,
  })
}

async function sendToDiscord(
  userId: string,
  category: NotificationCategory,
  message: { title: string; body: string | null; link: string }
) {
  try {
    const webhookUrl = await getDiscordWebhook(userId, category)
    if (!webhookUrl) return
    const siteUrl = appUrl().replace(/\/$/, '')
    const { embedName } = await getBranding()
    await notifyDiscord({
      webhookUrl,
      embeds: [
        {
          title: message.title,
          description: message.body ?? undefined,
          url: new URL(message.link, siteUrl).toString(),
          color: DISCORD_COLORS[category],
          footer: { text: embedName },
          timestamp: new Date().toISOString(),
        },
      ],
    })
  } catch (error) {
    logger.warn('Could not send Discord notification', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function pruneNotifications(userId: string) {
  await prisma.notification.deleteMany({
    where: {
      userId,
      createdAt: { lt: new Date(Date.now() - KEEP_DAYS * 86_400_000) },
    },
  })
}

export function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } })
}

export async function listNotifications(
  userId: string,
  options: {
    category?: NotificationCategory
    unreadOnly?: boolean
    cursor?: string
    limit?: number
  } = {}
) {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50)
  const items = await prisma.notification.findMany({
    where: {
      userId,
      ...(options.category ? { category: options.category } : {}),
      ...(options.unreadOnly ? { readAt: null } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      category: true,
      title: true,
      body: true,
      link: true,
      readAt: true,
      createdAt: true,
    },
  })
  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items
  return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null }
}

/** Marks the given notifications, or all of them, as read. */
export function markRead(userId: string, ids?: string[]) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  })
}

/** Deletes the given notifications, or all of them. */
export function clearNotifications(userId: string, ids?: string[]) {
  return prisma.notification.deleteMany({
    where: { userId, ...(ids ? { id: { in: ids } } : {}) },
  })
}
