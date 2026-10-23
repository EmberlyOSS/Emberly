'use client'

import Link from 'next/link'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  File as FileIcon,
  FileCode,
  FileImage,
  FileVideo,
  Files,
  HardDrive,
  Link2,
  MousePointerClick,
  Upload,
} from 'lucide-react'

import { Progress } from '@/packages/components/ui/progress'

interface RecentFile {
  id: string
  name: string
  urlPath: string
  mimeType: string
  size: string
  uploadedAt: string
}

interface RecentUrl {
  id: string
  shortCode: string
  targetUrl: string
  clicks: number
  createdAt: string
}

interface DashboardIndexProps {
  fileCount: number
  urlCount: number
  storage: {
    used: string
    /** null = unlimited */
    total: string | null
    percent: number | null
  }
  recentFiles: RecentFile[]
  recentUrls: RecentUrl[]
}

function fileIconFor(mime: string) {
  if (mime.startsWith('image/')) return FileImage
  if (mime.startsWith('video/')) return FileVideo
  if (
    mime.startsWith('text/') ||
    mime.includes('json') ||
    mime.includes('javascript')
  )
    return FileCode
  return FileIcon
}

function Stat({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  children?: React.ReactNode
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {children}
    </div>
  )
}

function Panel({
  title,
  href,
  children,
}: {
  title: string
  href: string
  children: React.ReactNode
}) {
  return (
    <section className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link
          href={href}
          className="group flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      {children}
    </section>
  )
}

function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType
  title: string
  action: { href: string; label: string }
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <div className="rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <Link
        href={action.href}
        className="text-sm font-medium text-primary hover:underline underline-offset-4"
      >
        {action.label}
      </Link>
    </div>
  )
}

export function DashboardIndex({
  fileCount,
  urlCount,
  storage,
  recentFiles,
  recentUrls,
}: DashboardIndexProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Files} label="Files" value={fileCount.toLocaleString()} />
        <Stat
          icon={Link2}
          label="Short links"
          value={urlCount.toLocaleString()}
        />
        <Stat icon={HardDrive} label="Storage" value={storage.used}>
          {storage.percent !== null ? (
            <div className="mt-3 space-y-1.5">
              <Progress
                value={storage.percent}
                className={`h-1.5 ${storage.percent > 90 ? '[&>div]:bg-destructive' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                {storage.percent.toFixed(0)}% of {storage.total}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Unlimited</p>
          )}
        </Stat>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent uploads" href="/dashboard/files">
          {recentFiles.length === 0 ? (
            <EmptyState
              icon={Upload}
              title="You haven't uploaded anything yet."
              action={{
                href: '/dashboard/upload',
                label: 'Upload your first file',
              }}
            />
          ) : (
            <ul className="divide-y divide-border/50">
              {recentFiles.map((f) => {
                const Icon = fileIconFor(f.mimeType)
                return (
                  <li key={f.id}>
                    <Link
                      href={f.urlPath}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {f.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {f.size}
                      </span>
                      <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground sm:block">
                        {formatDistanceToNow(new Date(f.uploadedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Recent links" href="/dashboard/urls">
          {recentUrls.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No short links yet."
              action={{ href: '/dashboard/urls', label: 'Shorten a URL' }}
            />
          ) : (
            <ul className="divide-y divide-border/50">
              {recentUrls.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/u/${u.shortCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium hover:text-primary"
                    >
                      /u/{u.shortCode}
                    </a>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.targetUrl}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    {u.clicks.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
