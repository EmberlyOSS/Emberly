import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { getProfile, updateSignal, removeSignal } from '@/packages/lib/nexium'
import { UpdateSignalSchema } from '@/packages/types/dto/nexium'
import { getRepo } from '@/packages/lib/github'
import { prisma } from '@/packages/lib/database/prisma'

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith('github.com')) return null
    const parts = parsed.pathname.replace(/^\//, '').split('/')
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') }
  } catch {
    return null
  }
}

/** PUT /api/discovery/signals/[id] */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const body = await req.json()
  const parsed = UpdateSignalSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)

  // Re-fetch GitHub metadata if URL is being updated on a GITHUB_REPO signal
  let metadata: Record<string, unknown> | undefined
  if (parsed.data.url) {
    const existing = await prisma.nexiumSignal.findFirst({ where: { id, profileId: profile.id }, select: { type: true } })
    const type = parsed.data.type ?? existing?.type
    if (type === 'GITHUB_REPO') {
      const gh = parseGitHubUrl(parsed.data.url)
      if (gh) {
        const repoData = await getRepo(gh.owner, gh.repo).catch(() => null)
        if (repoData) {
          metadata = {
            full_name: repoData.full_name,
            description: repoData.description,
            stargazers_count: repoData.stargazers_count,
            forks_count: repoData.forks_count,
            language: repoData.language,
            topics: repoData.topics,
            owner: { login: repoData.owner.login, avatar_url: repoData.owner.avatar_url },
          }
        }
      }
    }
  }

  const result = await updateSignal(id, profile.id, { ...parsed.data, metadata })
  return apiResponse(result)
}

/** DELETE /api/discovery/signals/[id] */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)

  await removeSignal(id, profile.id)
  return apiResponse({ ok: true })
}
