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

    for (const repo of orgRepos) {
      try {
        const commits = await getRepoCommits('EmberlyOSS', repo.name, githubAccount.providerUsername, 5)

        if (commits.length === 0) continue
        contributedRepos.push(repo)

        for (const commit of commits) {
          try {
            const commitDetail = await getCommitDetail('EmberlyOSS', repo.name, commit.sha)

            if (commitDetail) {
              const additions = commitDetail.stats?.additions || 0
              const deletions = commitDetail.stats?.deletions || 0
              const filesChanged = commitDetail.files?.length || 0

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
          } catch (commitError) {
            console.error(`Error fetching commit ${commit.sha}:`, commitError)
          }
        }
      } catch (error) {
        console.error(`Error fetching commits for ${repo.name}:`, error)
      }
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
