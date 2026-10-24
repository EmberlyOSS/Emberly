import { HTTP_STATUS, apiError, apiResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { events } from '@/lib/events'
import { EXPORT_COOLDOWN_MS, removeExports } from '@/lib/export/user-export'
import { loggers } from '@/lib/logger'

const logger = loggers.users

export const dynamic = 'force-dynamic'

async function latestExport(userId: string) {
  const latest = await prisma.dataExport.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      size: true,
      createdAt: true,
      completedAt: true,
      expiresAt: true,
    },
  })
  if (!latest) return null
  const expired =
    latest.status === 'ready' &&
    latest.expiresAt &&
    latest.expiresAt < new Date()
  return {
    ...latest,
    status: expired ? 'expired' : latest.status,
    size: latest.size == null ? null : Number(latest.size),
  }
}

export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response
  return apiResponse({ export: await latestExport(user.id) })
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  if (!user.email) {
    return apiError(
      'Add an email address to your account first, so we can send you the link.',
      HTTP_STATUS.BAD_REQUEST
    )
  }

  try {
    const recent = await prisma.dataExport.findFirst({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - EXPORT_COOLDOWN_MS) },
        status: { in: ['pending', 'ready'] },
      },
      select: { status: true },
    })
    if (recent) {
      return apiError(
        recent.status === 'pending'
          ? "Your export is still being prepared. We'll email you when it's ready."
          : 'You can request a new export an hour after the last one.',
        HTTP_STATUS.TOO_MANY_REQUESTS
      )
    }

    await removeExports(user.id)
    const created = await prisma.dataExport.create({
      data: { userId: user.id },
      select: { id: true },
    })

    await events.emit('account.export-requested', {
      userId: user.id,
      email: user.email,
      exportId: created.id,
    })

    return apiResponse({ export: await latestExport(user.id) })
  } catch (error) {
    logger.error('Could not start data export', error as Error, {
      userId: user.id,
    })
    return apiError(
      "Couldn't start your export",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
