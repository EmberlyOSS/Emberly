/**
 * GitHub REST API client
 */

import { loggers } from '@/packages/lib/logger'

const logger = loggers.api

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  bio: string | null
  email: string | null
  public_repos: number
  followers: number
  following: number
  company: string | null
  location: string | null
  blog: string | null
  twitter_username: string | null
  created_at: string
  updated_at: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  clone_url: string
  ssh_url: string
  private: boolean
  fork: boolean
  archived: boolean
  disabled: boolean
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  language: string | null
  topics: string[]
  default_branch: string
  created_at: string
  updated_at: string
  pushed_at: string
  owner: {
    id: number
    login: string
    avatar_url: string
    html_url: string
  }
}

export interface ContributionStats {
  username: string
  org: string
  totalCommits: number
  totalAdditions: number
  totalDeletions: number
  reposContributed: string[]
}

export interface GitHubCommit {
  sha: string
  html_url: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  author: {
    login: string
    avatar_url: string
  } | null
}

export interface GitHubCommitDetail extends GitHubCommit {
  stats?: {
    additions: number
    deletions: number
    total: number
  }
  files?: Array<{
    filename: string
    additions: number
    deletions: number
    changes: number
  }>
}

export interface GitHubReleaseAsset {
  name: string
  browser_download_url: string
  size: number
  content_type: string
}

export interface GitHubRelease {
  id: number
  tag_name: string
  name: string | null
  body: string | null
  html_url: string
  draft: boolean
  prerelease: boolean
  published_at: string | null
  created_at: string
  target_commitish: string
  author: {
    login: string
    avatar_url: string
    html_url: string
  } | null
  assets: GitHubReleaseAsset[]
}

// ---------------------------------------------------------------------------
// Core client
// ---------------------------------------------------------------------------

class GitHubClient {
  private token: string
  private baseUrl = 'https://api.github.com'

  constructor(token?: string) {
    this.token = token ?? process.env.GITHUB_PAT ?? ''
  }

  async request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const response = await fetch(url, {
      ...opts,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(this.token ? { Authorization: `token ${this.token}` } : {}),
        ...opts.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError(`GitHub API 404: ${path}`)
      }
      const body = await response.text().catch(() => '')
      throw new Error(`GitHub API error ${response.status} on ${path}: ${body}`)
    }

    return response.json() as Promise<T>
  }
}

class NotFoundError extends Error {
  readonly status = 404
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export const github = new GitHubClient()

// ---------------------------------------------------------------------------
// User / contributor helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a single GitHub user profile. Returns null if the user doesn't exist.
 */
export async function getGitHubUser(username: string): Promise<GitHubUser | null> {
  try {
    return await github.request<GitHubUser>(`/users/${encodeURIComponent(username)}`)
  } catch (error) {
    if (error instanceof NotFoundError) return null
    logger.error('Failed to fetch GitHub user', error as Error, { username })
    throw error
  }
}

/**
 * List public (and, with the right token, private) members of a GitHub org.
 * Defaults to the GITHUB_ORG env var.
 */
export async function getOrgMembers(org?: string): Promise<GitHubUser[]> {
  const orgName = org ?? process.env.GITHUB_ORG ?? 'EmberlyOSS'
  try {
    return await github.request<GitHubUser[]>(
      `/orgs/${encodeURIComponent(orgName)}/members?per_page=100`
    )
  } catch (error) {
    logger.error('Failed to fetch org members', error as Error, { org: orgName })
    throw error
  }
}

/**
 * Aggregate commit/line contribution stats for a user across all repos in an org.
 */
export async function getUserContributions(
  username: string,
  org?: string
): Promise<ContributionStats> {
  const orgName = org ?? process.env.GITHUB_ORG ?? 'EmberlyOSS'

  const repos = await getOrgRepos(orgName)

  let totalCommits = 0
  let totalAdditions = 0
  let totalDeletions = 0
  const reposContributed: string[] = []

  for (const repo of repos) {
    try {
      const commits = await github.request<Array<{ sha: string }>>(
        `/repos/${encodeURIComponent(orgName)}/${encodeURIComponent(repo.name)}/commits` +
          `?author=${encodeURIComponent(username)}&per_page=100`
      )

      if (commits.length === 0) continue

      reposContributed.push(repo.name)
      totalCommits += commits.length

      for (const commit of commits) {
        try {
          const detail = await github.request<{
            stats?: { additions: number; deletions: number }
          }>(`/repos/${encodeURIComponent(orgName)}/${encodeURIComponent(repo.name)}/commits/${commit.sha}`)

          totalAdditions += detail.stats?.additions ?? 0
          totalDeletions += detail.stats?.deletions ?? 0
        } catch (error) {
          logger.debug('Failed to fetch commit detail', { repo: repo.name, sha: commit.sha })
        }
      }
    } catch (error) {
      logger.debug('Failed to fetch commits for repo', { repo: repo.name, username })
    }
  }

  return { username, org: orgName, totalCommits, totalAdditions, totalDeletions, reposContributed }
}

// ---------------------------------------------------------------------------
// Repository helpers
// ---------------------------------------------------------------------------

/**
 * List all repos in a GitHub org (up to 100). Defaults to GITHUB_ORG env var.
 */
export async function getOrgRepos(org?: string): Promise<GitHubRepo[]> {
  const orgName = org ?? process.env.GITHUB_ORG ?? 'EmberlyOSS'
  try {
    return await github.request<GitHubRepo[]>(
      `/orgs/${encodeURIComponent(orgName)}/repos?per_page=100&type=all`
    )
  } catch (error) {
    logger.error('Failed to fetch org repos', error as Error, { org: orgName })
    throw error
  }
}

/**
 * Fetch a single repository. Returns null if the repo doesn't exist.
 */
export async function getRepo(owner: string, name: string): Promise<GitHubRepo | null> {
  try {
    return await github.request<GitHubRepo>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`
    )
  } catch (error) {
    if (error instanceof NotFoundError) return null
    logger.error('Failed to fetch repo', error as Error, { owner, name })
    throw error
  }
}

/**
 * List releases for a single repository.
 */
export async function getRepoReleases(
  owner: string,
  name: string,
  perPage = 10
): Promise<GitHubRelease[]> {
  try {
    return await github.request<GitHubRelease[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/releases?per_page=${perPage}`
    )
  } catch (error) {
    if (error instanceof NotFoundError) return []
    logger.error('Failed to fetch repo releases', error as Error, { owner, name })
    throw error
  }
}

/**
 * Fetch all releases across every repo in an org, sorted newest-first.
 * Defaults to GITHUB_ORG env var.
 */
export async function getOrgReleases(
  org?: string
): Promise<Array<GitHubRelease & { repo: string; repoUrl: string }>> {
  const orgName = org ?? process.env.GITHUB_ORG ?? 'EmberlyOSS'
  const repos = await getOrgRepos(orgName)

  const releasesArrays = await Promise.all(
    repos.map(async (r) => {
      try {
        const rels = await getRepoReleases(orgName, r.name)
        return rels.map((rl) => ({ ...rl, repo: r.name, repoUrl: r.html_url }))
      } catch {
        return []
      }
    })
  )

  const all = releasesArrays.flat()
  all.sort(
    (a, b) =>
      new Date(b.published_at ?? b.created_at).getTime() -
      new Date(a.published_at ?? a.created_at).getTime()
  )
  return all
}

// ---------------------------------------------------------------------------
// User-scoped helpers
// ---------------------------------------------------------------------------

/**
 * List a user's public repositories, sorted by most recently updated.
 */
export async function getUserRepos(
  username: string,
  perPage = 30
): Promise<GitHubRepo[]> {
  try {
    return await github.request<GitHubRepo[]>(
      `/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${perPage}`
    )
  } catch (error) {
    if (error instanceof NotFoundError) return []
    logger.error('Failed to fetch user repos', error as Error, { username })
    throw error
  }
}

/**
 * List commits for a repo, optionally filtered by author username.
 */
export async function getRepoCommits(
  owner: string,
  name: string,
  author?: string,
  perPage = 30
): Promise<GitHubCommit[]> {
  const authorQuery = author ? `&author=${encodeURIComponent(author)}` : ''
  try {
    return await github.request<GitHubCommit[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits?per_page=${perPage}${authorQuery}`
    )
  } catch (error) {
    if (error instanceof NotFoundError) return []
    logger.error('Failed to fetch repo commits', error as Error, { owner, name, author })
    throw error
  }
}

/**
 * Get full details (stats + files) for a single commit.
 */
export async function getCommitDetail(
  owner: string,
  name: string,
  sha: string
): Promise<GitHubCommitDetail | null> {
  try {
    return await github.request<GitHubCommitDetail>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits/${sha}`
    )
  } catch (error) {
    if (error instanceof NotFoundError) return null
    logger.error('Failed to fetch commit detail', error as Error, { owner, name, sha })
    throw error
  }
}

/**
 * Check if a GitHub user is a member of an org.
 * Returns false for non-members and 404s; throws on other API errors.
 * Requires a PAT with `read:org` scope.
 */
export async function isOrgMember(
  username: string,
  org?: string
): Promise<boolean> {
  const orgName = org ?? process.env.GITHUB_ORG ?? 'EmberlyOSS'
  try {
    await github.request<void>(
      `/orgs/${encodeURIComponent(orgName)}/members/${encodeURIComponent(username)}`
    )
    return true
  } catch (error) {
    if (error instanceof NotFoundError) return false
    logger.error('Failed to check org membership', error as Error, { username, org: orgName })
    throw error
  }
}
