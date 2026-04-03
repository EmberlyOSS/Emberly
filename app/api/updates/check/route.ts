import { NextResponse } from 'next/server'

import pkg from '@/package.json'

import { requireAdmin } from '@/packages/lib/auth/api-auth'
import { getRepoReleases } from '@/packages/lib/github'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.api

function compareVersions(v1: string, v2: string): number {
  const v1Parts = v1.replace(/^v/, '').split('.').map(Number)
  const v2Parts = v2.replace(/^v/, '').split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] > v2Parts[i]) return 1
    if (v1Parts[i] < v2Parts[i]) return -1
  }
  return 0
}

export async function GET() {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    const currentVersion = pkg.version
    const releases = await getRepoReleases('EmberlyOSS', 'Website', 30)

    const stableReleases = releases
      .filter((release) => !release.prerelease && !release.draft)
      .sort((a, b) => compareVersions(b.tag_name, a.tag_name))

    const latestRelease = stableReleases[0]

    if (!latestRelease) {
      return NextResponse.json({
        currentVersion,
        hasUpdate: false,
        message: 'No releases found',
      })
    }

    const hasUpdate =
      compareVersions(latestRelease.tag_name, currentVersion) > 0

    return NextResponse.json({
      currentVersion,
      hasUpdate,
      latestVersion: latestRelease.tag_name,
      releaseUrl: latestRelease.html_url,
      message: hasUpdate
        ? `Update available: ${latestRelease.tag_name}`
        : 'Your instance is up to date',
    })
  } catch (error) {
    logger.error('Update check error:', error as Error)
    return NextResponse.json(
      { error: 'Failed to check for updates' },
      { status: 500 }
    )
  }
}
