import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'

interface GitHubApiRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  private: boolean
  fork: boolean
  archived: boolean
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  pushed_at: string
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

/**
 * GET /api/discovery/repos
 * Lists the authenticated user's own GitHub repos using their linked OAuth token.
 * Requires the user to have linked their GitHub account via /api/auth/link/github.
 */
export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const linked = await prisma.linkedAccount.findUnique({
    where: { userId_provider: { userId: user.id, provider: 'github' } },
    select: { accessToken: true, providerUsername: true },
  })

  if (!linked?.accessToken) {
    return apiError('GitHub account not linked', HTTP_STATUS.NOT_FOUND)
  }

  try {
    const ghRes = await fetch(
      'https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member',
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${linked.accessToken}`,
        },
        next: { revalidate: 60 },
      }
    )

    if (!ghRes.ok) {
      const body = await ghRes.text().catch(() => '')
      if (ghRes.status === 401) {
        return apiError('GitHub token is expired. Please re-link your GitHub account.', HTTP_STATUS.UNAUTHORIZED)
      }
      return apiError(`GitHub API error: ${ghRes.status}`, HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }

    const repos = (await ghRes.json()) as GitHubApiRepo[]

    // Return a lean shape, filtering out forks/archived by default but keeping them available
    const result = repos.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      html_url: r.html_url,
      private: r.private,
      fork: r.fork,
      archived: r.archived,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      language: r.language,
      topics: r.topics ?? [],
      pushed_at: r.pushed_at,
      owner: { login: r.owner.login, avatar_url: r.owner.avatar_url },
    }))

    return apiResponse(result)
  } catch (err: any) {
    return apiError(err.message ?? 'Failed to fetch GitHub repos', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
