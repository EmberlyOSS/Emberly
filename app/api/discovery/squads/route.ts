import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { getAuthenticatedUser, requireAuth } from '@/packages/lib/auth/api-auth'
import { listSquads, createSquad } from '@/packages/lib/nexium'
import { CreateSquadSchema } from '@/packages/types/dto/nexium'
import { prisma } from '@/packages/lib/database/prisma'
import { events } from '@/packages/lib/events'
import type { NexiumSquadStatus } from '@/prisma/generated/prisma/client'

/** GET /api/discovery/squads — list public squads, or `?mine=true` for user's own squads */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const mine = url.searchParams.get('mine') === 'true'

  if (mine) {
    const user = await getAuthenticatedUser(req)
    if (!user) return apiError('Unauthorized', HTTP_STATUS.UNAUTHORIZED)

    const memberships = await prisma.nexiumSquadMember.findMany({
      where: { userId: user.id },
      include: {
        squad: {
          include: {
            owner: { select: { name: true, image: true, urlId: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const squads = memberships.map((m) => ({ ...m.squad, myRole: m.role }))
    return apiResponse({ squads })
  }

  const page = Number(url.searchParams.get('page') ?? '1')
  const limit = Number(url.searchParams.get('limit') ?? '20')
  const skill = url.searchParams.get('skill') ?? undefined
  const status = (url.searchParams.get('status') ?? undefined) as NexiumSquadStatus | undefined

  const result = await listSquads({ page, limit, skill, status })
  return apiResponse(result)
}

/** POST /api/discovery/squads — create a squad */
export async function POST(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const body = await req.json()
  const parsed = CreateSquadSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  try {
    const squad = await createSquad(user.id, parsed.data)

    void events.emit('nexium.squad-created', {
      userId: user.id,
      email: user.email!,
      squadId: squad.id,
      squadName: parsed.data.name,
    }).catch((err) => console.error('[Events] Failed to emit nexium.squad-created', err))

    return apiResponse(squad, HTTP_STATUS.CREATED)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to create squad', HTTP_STATUS.BAD_REQUEST)
  }
}
