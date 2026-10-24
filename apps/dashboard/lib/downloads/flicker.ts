import { getRepoReleases } from '@/lib/github'

export const FLICKER_REPO = 'https://github.com/EmberlyOSS/Flicker'

export interface FlickerFile {
  label: string
  url: string
  size: number
}

export interface FlickerRelease {
  version: string
  publishedAt: string
  notesUrl: string
  windows: FlickerFile[]
  macArm: FlickerFile[]
  macIntel: FlickerFile[]
  linux: FlickerFile[]
}

const INSTALLERS: Array<{
  test: RegExp
  platform: keyof Pick<
    FlickerRelease,
    'windows' | 'macArm' | 'macIntel' | 'linux'
  >
  label: string
}> = [
  { test: /_x64-setup\.exe$/, platform: 'windows', label: 'Installer (.exe)' },
  { test: /\.msi$/, platform: 'windows', label: 'MSI package' },
  { test: /_aarch64\.dmg$/, platform: 'macArm', label: 'Apple silicon (.dmg)' },
  { test: /_x64\.dmg$/, platform: 'macIntel', label: 'Intel (.dmg)' },
  { test: /\.AppImage$/, platform: 'linux', label: 'AppImage' },
  { test: /\.deb$/, platform: 'linux', label: 'Debian / Ubuntu (.deb)' },
  { test: /\.rpm$/, platform: 'linux', label: 'Fedora / openSUSE (.rpm)' },
]

// Releases change rarely, and GitHub allows 60 unauthenticated requests an hour
const CACHE_MS = 10 * 60 * 1000
let cache: { at: number; release: FlickerRelease | null } | null = null

async function fetchLatest(): Promise<FlickerRelease | null> {
  const releases = await getRepoReleases('EmberlyOSS', 'Flicker', 10)
  const latest = releases.find((r) => !r.draft && !r.prerelease)
  if (!latest) return null

  const release: FlickerRelease = {
    version: latest.tag_name.replace(/^v/, ''),
    publishedAt: latest.published_at ?? latest.created_at,
    notesUrl: latest.html_url,
    windows: [],
    macArm: [],
    macIntel: [],
    linux: [],
  }
  for (const { test, platform, label } of INSTALLERS) {
    const asset = latest.assets.find((a) => test.test(a.name))
    if (asset) {
      release[platform].push({
        label,
        url: asset.browser_download_url,
        size: asset.size,
      })
    }
  }
  return release
}

export async function getLatestFlicker(): Promise<FlickerRelease | null> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.release
  try {
    const release = await fetchLatest()
    cache = { at: Date.now(), release }
    return release
  } catch {
    return cache?.release ?? null
  }
}
