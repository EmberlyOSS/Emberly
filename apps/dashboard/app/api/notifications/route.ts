import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
  clearNotifications,
  listNotifications,
  markRead,
  unreadCount,
} from '@/lib/notifications'

function parseIds(body: unknown): string[] | undefined | null {
  const ids = (body as { ids?: unknown } | null)?.ids
  if (ids === undefined) return undefined
  if (!Array.isArray(ids) || ids.length > 100) return null
  return ids.every((id) => typeof id === 'string') ? (ids as string[]) : null
}

export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const params = new URL(req.url).searchParams
  const category = params.get('category') as NotificationCategory | null
  if (category && !NOTIFICATION_CATEGORIES.includes(category)) {
    return apiError('Unknown category', HTTP_STATUS.BAD_REQUEST)
  }

  const [page, unread] = await Promise.all([
    listNotifications(user.id, {
      category: category ?? undefined,
      unreadOnly: params.get('unread') === 'true',
      cursor: params.get('cursor') ?? undefined,
      limit: Number(params.get('limit')) || undefined,
    }),
    unreadCount(user.id),
  ])

  return apiResponse({ ...page, unread })
}

/** Marks notifications read: `{ "ids": [...] }`, or every one when ids is omitted. */
export async function PATCH(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const ids = parseIds(await req.json().catch(() => ({})))
  if (ids === null)
    return apiError('ids must be a list', HTTP_STATUS.BAD_REQUEST)

  const { count } = await markRead(user.id, ids)
  return apiResponse({ updated: count })
}

/** Deletes notifications: `{ "ids": [...] }`, or every one when ids is omitted. */
export async function DELETE(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const ids = parseIds(await req.json().catch(() => ({})))
  if (ids === null)
    return apiError('ids must be a list', HTTP_STATUS.BAD_REQUEST)

  const { count } = await clearNotifications(user.id, ids)
  return apiResponse({ deleted: count })
}
