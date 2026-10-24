import Link from 'next/link'

import { FaApple, FaLinux, FaWindows } from 'react-icons/fa6'
import {
  BookOpen,
  Code2,
  Crosshair,
  ExternalLink,
  Github,
  History,
  Keyboard,
  Monitor,
  Server,
  Terminal,
  Video,
} from 'lucide-react'

import { FlickerDownloadButton } from '@/components/downloads/flicker-download'
import PageShell from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { getBranding } from '@/lib/branding'
import {
  FLICKER_REPO,
  type FlickerFile,
  getLatestFlicker,
} from '@/lib/downloads/flicker'
import { buildPageMetadata } from '@/lib/embeds/metadata'
import { formatBytes } from '@/lib/utils/formatting'

export const dynamic = 'force-dynamic'

export const metadata = buildPageMetadata({
  title: 'Downloads',
  description:
    'Flicker for Windows, macOS and Linux, plus configs for ShareX, Flameshot and more.',
})

const DOCS = 'https://docs.embrly.ca'

const FEATURES = [
  { icon: Crosshair, text: 'Capture a region, a window or every screen' },
  { icon: Video, text: 'Record your screen to MP4' },
  { icon: Keyboard, text: 'Shortcuts that work from any app' },
  { icon: History, text: 'Your uploads and stats, synced with your account' },
]

const OTHER_TOOLS = [
  {
    icon: Monitor,
    name: 'ShareX',
    system: 'Windows',
    description:
      'Download a ready-made uploader config and import it into ShareX.',
    guide: `${DOCS}/integrations/sharex`,
  },
  {
    icon: Crosshair,
    name: 'Flameshot',
    system: 'Linux, macOS, Windows',
    description:
      'A script that uploads each Flameshot capture and copies the link.',
    guide: `${DOCS}/integrations/flameshot`,
  },
  {
    icon: Monitor,
    name: 'Spectacle',
    system: 'KDE Plasma',
    description: 'Upload screenshots from KDE’s built-in screenshot tool.',
    guide: `${DOCS}/integrations`,
  },
  {
    icon: Terminal,
    name: 'Scripts',
    system: 'Bash, PowerShell',
    description: 'Upload files from the command line or your own automation.',
    guide: `${DOCS}/integrations/bash-scripting`,
  },
]

function PlatformColumn({
  icon: Icon,
  name,
  groups,
}: {
  icon: React.ElementType
  name: string
  groups: Array<{ heading?: string; files: FlickerFile[] }>
}) {
  const files = groups.flatMap((g) => g.files)
  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">{name}</h3>
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Not in this release yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {groups.map((group) =>
            group.files.map((file) => (
              <li key={file.url}>
                <a
                  href={file.url}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
                >
                  <span>{file.label}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatBytes(file.size, 0)}
                  </span>
                </a>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default async function DownloadsPage() {
  const [release, branding] = await Promise.all([
    getLatestFlicker(),
    getBranding(),
  ])
  const released = release
    ? new Date(release.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null

  return (
    <PageShell
      eyebrow="Resources"
      title="Downloads"
      subtitle={`Apps and tools for uploading to ${branding.name} from your computer.`}
    >
      <section className="glass-card overflow-hidden">
        <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <img
                src="/branding/flicker/icon.svg"
                alt=""
                className="h-16 w-16 shrink-0 rounded-2xl"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">Flicker</h2>
                  {release && (
                    <Badge variant="secondary" className="tabular-nums">
                      v{release.version}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  The desktop app for screenshots, recordings and uploads
                  {released && <> · Released {released}</>}
                </p>
              </div>
            </div>

            <p className="max-w-2xl leading-relaxed text-muted-foreground">
              Press a shortcut, pick an area, and the link is on your clipboard
              a moment later. Flicker runs quietly in your tray or menu bar and
              updates itself.
            </p>

            <div className="flex flex-wrap items-start gap-3">
              {release ? (
                <FlickerDownloadButton release={release} />
              ) : (
                <Button size="lg" asChild>
                  <a href={`${FLICKER_REPO}/releases/latest`}>
                    <Github className="mr-2 h-4 w-4" />
                    Download from GitHub
                  </a>
                </Button>
              )}
              {release && (
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-background/50"
                  asChild
                >
                  <a
                    href={release.notesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    What’s new
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {text}
              </li>
            ))}
            <li className="flex items-start gap-3 text-sm">
              <Server className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Works with embrly.ca and self-hosted servers
            </li>
          </ul>
        </div>
      </section>

      {release && (
        <section id="platforms" className="scroll-mt-28 space-y-4">
          <h2 className="text-lg font-semibold">All downloads</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <PlatformColumn
              icon={FaWindows}
              name="Windows"
              groups={[{ files: release.windows }]}
            />
            <PlatformColumn
              icon={FaApple}
              name="macOS"
              groups={[{ files: release.macArm }, { files: release.macIntel }]}
            />
            <PlatformColumn
              icon={FaLinux}
              name="Linux"
              groups={[{ files: release.linux }]}
            />
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                Opening Flicker for the first time.
              </span>{' '}
              The installers aren’t code-signed yet. Windows may warn about an
              unknown publisher; choose <strong>More info → Run anyway</strong>.
              On macOS, move Flicker to Applications and run{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
                xattr -cr /Applications/Flicker.app
              </code>{' '}
              once in Terminal if macOS says it’s damaged.
            </p>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Use a tool you already have</h2>
          <p className="text-sm text-muted-foreground">
            Get your personal config from{' '}
            <Link
              href="/me?tab=uploads"
              className="text-primary hover:underline"
            >
              Profile → Uploads
            </Link>{' '}
            once you’re signed in.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OTHER_TOOLS.map(
            ({ icon: Icon, name, system, description, guide }) => (
              <div key={name} className="glass-card flex flex-col p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{system}</p>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {description}
                </p>
                <a
                  href={guide}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Setup guide
                </a>
              </div>
            )
          )}
        </div>
      </section>

      <section className="glass-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-semibold">Building your own?</h2>
            <p className="text-sm text-muted-foreground">
              Upload, shorten links and manage files with the REST API.
            </p>
          </div>
        </div>
        <Button variant="outline" className="bg-background/50" asChild>
          <a href={`${DOCS}/api`} target="_blank" rel="noopener noreferrer">
            API docs
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </section>
    </PageShell>
  )
}
