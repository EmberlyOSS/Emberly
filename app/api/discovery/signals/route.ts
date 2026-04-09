import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { getProfile, addSignal, reorderSignals } from '@/packages/lib/nexium'
import { SignalInputSchema, ReorderSignalsSchema } from '@/packages/types/dto/nexium'
import { events } from '@/packages/lib/events'
import { getRepo } from '@/packages/lib/github'

/** Parse owner + repo name from a github.com URL, returning null if not a GitHub URL. */
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

/** GET /api/discovery/signals — list own signals */
export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)
  return apiResponse(profile.signals)
}

/** POST /api/discovery/signals — add a signal (or reorder) */
export async function POST(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const body = await req.json()

  if (Array.isArray(body.orderedIds)) {
    const parsed = ReorderSignalsSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)
    const profile = await getProfile(user.id)
    if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)
    await reorderSignals(profile.id, parsed.data.orderedIds)
    return apiResponse({ ok: true })
  }

  const parsed = SignalInputSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', HTTP_STATUS.BAD_REQUEST)

  const profile = await getProfile(user.id)
  if (!profile) return apiError('Discovery profile not found', HTTP_STATUS.NOT_FOUND)

  try {
    // Auto-fetch GitHub repo metadata when URL is a github.com repo link
    let metadata: Record<string, unknown> | undefined
    if (parsed.data.type === 'GITHUB_REPO' && parsed.data.url) {
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

    const signal = await addSignal(profile.id, { ...parsed.data, metadata })

    void events.emit('nexium.signal-added', {
      userId: user.id,
      email: user.email!,
      signalType: parsed.data.type,
      signalTitle: parsed.data.title,
    }).catch((err) => console.error('[Events] Failed to emit nexium.signal-added', err))

    return apiResponse(signal, HTTP_STATUS.CREATED)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to add signal', HTTP_STATUS.BAD_REQUEST)
  }
}
