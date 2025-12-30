import { NextResponse } from 'next/server'
import { prisma } from '@/packages/lib/database/prisma'
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
    
    // Use GitHub PAT for public profile viewing (not user's token)
    const githubPAT = process.env.GITHUB_PAT
    if (!githubPAT || !githubAccount.providerUsername) {
      return NextResponse.json({ linesOfCode: 0, repos: [] }, { status: 200 })
    }

    // Get contribution stats
    const linesOfCode = await getContributorLinesOfCode(
      githubAccount.providerUsername,
      githubPAT
    )

    // Fetch recent repos they contributed to
    const reposResponse = await fetch(
      `https://api.github.com/users/${githubAccount.providerUsername}/repos?sort=updated&per_page=10`,
      {
        headers: {
          Authorization: `token ${githubPAT}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    const repos = reposResponse.ok ? await reposResponse.json() : []
    const emberlyRepos = repos.filter((r: any) => 
      r.owner?.login === 'EmberlyOSS'
    )

    // Fetch recent commits from EmberlyOSS repos
    const recentCommits: any[] = []
    let totalFilesChanged = 0
    let totalAdditions = 0
    let totalDeletions = 0

    for (const repo of emberlyRepos.slice(0, 5)) { // Check top 5 repos
      try {
        const commitsResponse = await fetch(
          `https://api.github.com/repos/EmberlyOSS/${repo.name}/commits?author=${githubAccount.providerUsername}&per_page=5`,
          {
            headers: {
              Authorization: `token ${githubPAT}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        )

        if (commitsResponse.ok) {
          const commits = await commitsResponse.json()
          
          for (const commit of commits) {
            // Fetch detailed commit info to get stats
            try {
              const commitDetailResponse = await fetch(
                `https://api.github.com/repos/EmberlyOSS/${repo.name}/commits/${commit.sha}`,
                {
                  headers: {
                    Authorization: `token ${githubPAT}`,
                    Accept: 'application/vnd.github.v3+json',
                  },
                }
              )

              if (commitDetailResponse.ok) {
                const commitDetail = await commitDetailResponse.json()
                
                const additions = commitDetail.stats?.additions || 0
                const deletions = commitDetail.stats?.deletions || 0
                const filesChanged = commitDetail.files?.length || 0

                recentCommits.push({
                  sha: commit.sha.substring(0, 7),
                  message: commit.commit.message.split('\n')[0], // First line only
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
      repos: emberlyRepos.map((r: any) => ({
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
        totalRepos: emberlyRepos.length,
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
