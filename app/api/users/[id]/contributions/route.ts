import { NextResponse } from 'next/server'
import { prisma } from '@/packages/lib/database/prisma'
import { getCommitDetail, getOrgRepos, getRepoCommits } from '@/packages/lib/github'
import { getContributorLinesOfCode } from '@/packages/lib/perks/github'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find user by id, urlId, vanityId, or name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { urlId: id },
          { vanityId: id },
          { name: { equals: id, mode: 'insensitive' } },
        ],
        isProfilePublic: true,
      },
      select: {
        id: true,
        linkedAccounts: {
          where: { provider: 'github' },
          select: {
            providerUsername: true,
            accessToken: true,
          },
        },
      },
    })

    if (!user || !user.linkedAccounts[0]) {
      return NextResponse.json({ linesOfCode: 0, repos: [] }, { status: 200 })
    }

    const githubAccount = user.linkedAccounts[0]
    
    if (!githubAccount.providerUsername) {
      return NextResponse.json({ linesOfCode: 0, repos: [] }, { status: 200 })
    }

    // Get contribution stats
    const linesOfCode = await getContributorLinesOfCode(
      githubAccount.providerUsername,
      ''
    )

    // Fetch EmberlyOSS org repos and find ones the user contributed to
    const orgRepos = await getOrgRepos('EmberlyOSS')

    const recentCommits: Array<{
      sha: string; message: string; date: string; url: string
      repo: string; additions: number; deletions: number; filesChanged: number
    }> = []
    let totalFilesChanged = 0
    let totalAdditions = 0
    let totalDeletions = 0
    const contributedRepos: typeof orgRepos = []

    // Parallel: fetch commits for all repos simultaneously
    const repoCommitResults = await Promise.allSettled(
      orgRepos.map(async (repo) => {
        const commits = await getRepoCommits('EmberlyOSS', repo.name, githubAccount.providerUsername, 5)
        return { repo, commits }
      })
    )

    const reposWithCommits = repoCommitResults
      .filter((r): r is PromiseFulfilledResult<{ repo: (typeof orgRepos)[0]; commits: Awaited<ReturnType<typeof getRepoCommits>> }> =>
        r.status === 'fulfilled' && r.value.commits.length > 0
      )
      .map((r) => r.value)

    for (const { repo } of reposWithCommits) {
      contributedRepos.push(repo)
    }

    // Parallel: fetch all commit details across all repos simultaneously
    const commitDetailResults = await Promise.allSettled(
      reposWithCommits.flatMap(({ repo, commits }) =>
        commits.map(async (commit) => {
          const detail = await getCommitDetail('EmberlyOSS', repo.name, commit.sha)
          return { repo, commit, detail }
        })
      )
    )

    for (const result of commitDetailResults) {
      if (result.status !== 'fulfilled' || !result.value.detail) continue
      const { repo, commit, detail } = result.value
      const additions = detail.stats?.additions || 0
      const deletions = detail.stats?.deletions || 0
      const filesChanged = detail.files?.length || 0

      recentCommits.push({
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message.split('\n')[0],
        date: commit.commit.author.date,
        url: commit.html_url,
        repo: repo.name,
        additions,
        deletions,
        filesChanged,
      })

      totalFilesChanged += filesChanged
      totalAdditions += additions
      totalDeletions += deletions
    }

    // Sort commits by date and limit to 10 most recent
    recentCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const topCommits = recentCommits.slice(0, 10)

    return NextResponse.json({
      linesOfCode,
      repos: contributedRepos.map((r) => ({
        name: r.name,
        url: r.html_url,
        description: r.description,
        stars: r.stargazers_count,
        language: r.language,
      })),
      recentCommits: topCommits,
      stats: {
        totalFilesChanged,
        totalAdditions,
        totalDeletions,
        totalRepos: contributedRepos.length,
      },
    })
  } catch (error) {
    console.error('[GET /api/users/[id]/contributions]', error)
    return NextResponse.json({ 
      linesOfCode: 0, 
      repos: [], 
      recentCommits: [], 
      stats: { totalFilesChanged: 0, totalAdditions: 0, totalDeletions: 0, totalRepos: 0 } 
    }, { status: 200 })
  }
}
