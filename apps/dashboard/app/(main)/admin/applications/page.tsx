import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, ClipboardList } from 'lucide-react'

import { AdminShell } from '@/components/admin/admin-shell'
import {
  EmptyState,
  LinkTabs,
  Panel,
  StatusBadge,
  type BadgeTone,
} from '@/components/layout/page-kit'
import { humanize } from '@/lib/utils/humanize'
import { prisma } from '@emberly/db'
import { buildPageMetadata } from '@/lib/embeds/metadata'
import { ApplicationStatus, ApplicationType } from '@emberly/db'

export const metadata = buildPageMetadata({
  title: 'Applications',
  description: 'Review and manage user applications.',
})

const STATUS_TONES: Record<ApplicationStatus, BadgeTone> = {
  PENDING: 'warning',
  REVIEWING: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
}

const VALID_STATUSES = [
  'PENDING',
  'REVIEWING',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
] as const
const VALID_TYPES = [
  'STAFF',
  'PARTNER',
  'VERIFICATION',
  'BAN_APPEAL',
  'LIMIT_INCREASE',
] as const

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const { status, type } = await searchParams

  const filterStatus = VALID_STATUSES.includes(status as ApplicationStatus)
    ? (status as ApplicationStatus)
    : undefined
  const filterType = VALID_TYPES.includes(type as ApplicationType)
    ? (type as ApplicationType)
    : undefined

  const [applications, counts] = await Promise.all([
    prisma.application.findMany({
      where: {
        ...(filterStatus && { status: filterStatus }),
        ...(filterType && { type: filterType }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            urlId: true,
            image: true,
          },
        },
      },
    }),
    prisma.application.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all])
  )

  const buildUrl = (params: { status?: string; type?: string }) => {
    const q = new URLSearchParams()
    if (params.status) q.set('status', params.status)
    if (params.type) q.set('type', params.type)
    const qs = q.toString()
    return `/admin/applications${qs ? `?${qs}` : ''}`
  }

  const total = Object.values(countByStatus).reduce((a, b) => a + b, 0)
  const statusTabs = [
    {
      href: buildUrl({ type: filterType }),
      label: 'All',
      active: !filterStatus,
      count: total,
    },
    ...VALID_STATUSES.map((s) => ({
      href: buildUrl({ status: s, type: filterType }),
      label: humanize(s),
      active: filterStatus === s,
      count: countByStatus[s] ?? 0,
    })),
  ]
  const typeTabs = [
    {
      href: buildUrl({ status: filterStatus }),
      label: 'All types',
      active: !filterType,
    },
    ...VALID_TYPES.map((t) => ({
      href: buildUrl({ status: filterStatus, type: t }),
      label: humanize(t),
      active: filterType === t,
    })),
  ]

  return (
    <AdminShell
      title="Applications"
      description="Review staff, partner, verification, limit increase and ban appeal applications."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LinkTabs options={statusTabs} label="Status" />
        <LinkTabs options={typeTabs} label="Type" />
      </div>

      <Panel
        flush
        title={`${applications.length} ${applications.length === 1 ? 'application' : 'applications'}`}
        description="Newest first. Showing up to 50."
      >
        {applications.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No applications"
            description="Nothing matches these filters."
          />
        ) : (
          <ul className="divide-y divide-border/50">
            {applications.map((app) => (
              <li key={app.id}>
                <Link
                  href={`/admin/applications/${app.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
                >
                  {app.user.image ? (
                    <Image
                      src={app.user.image}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {(app.user.name ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">
                        {app.user.name ?? '—'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {humanize(app.type)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {app.user.email}
                    </p>
                  </div>
                  <StatusBadge tone={STATUS_TONES[app.status]}>
                    {humanize(app.status)}
                  </StatusBadge>
                  <span className="hidden w-24 text-right text-sm text-muted-foreground sm:block">
                    {app.createdAt.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  )
}
