import Link from 'next/link'

import { AdminShell } from '@/components/admin/admin-shell'
import { Flag } from 'lucide-react'

import {
  EmptyState,
  LinkTabs,
  Panel,
  StatusBadge,
  type BadgeTone,
} from '@/components/layout/page-kit'
import { humanize } from '@/lib/utils/humanize'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isCloudEnabled } from '@/lib/config/env'
import { prisma } from '@emberly/db'
import { buildPageMetadata } from '@/lib/embeds/metadata'
import { ReportStatus } from '@emberly/db'

export const metadata = buildPageMetadata({
  title: 'Reports',
  description: 'Review and resolve user and squad reports.',
})

const STATUS_TONES: Record<ReportStatus, BadgeTone> = {
  PENDING: 'warning',
  REVIEWING: 'info',
  RESOLVED: 'success',
  DISMISSED: 'neutral',
}

const VALID_STATUSES = [
  'PENDING',
  'REVIEWING',
  'RESOLVED',
  'DISMISSED',
] as const

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const { status, type } = await searchParams
  const filterStatus = VALID_STATUSES.includes(status as ReportStatus)
    ? (status as ReportStatus)
    : undefined

  const cloudEnabled = isCloudEnabled()
  const viewType =
    type === 'squad' && cloudEnabled
      ? 'squad'
      : type === 'content'
        ? 'content'
        : 'user'

  const [userReports, squadReports, contentReports] = await Promise.all([
    viewType === 'user'
      ? prisma.userReport.findMany({
          where: filterStatus ? { status: filterStatus } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            reportedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                urlId: true,
                image: true,
              },
            },
            reporterUser: {
              select: { id: true, name: true, email: true, urlId: true },
            },
          },
        })
      : Promise.resolve([]),
    viewType === 'squad'
      ? prisma.squadReport.findMany({
          where: filterStatus ? { status: filterStatus } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            squad: {
              select: { id: true, name: true, slug: true },
            },
            reporterUser: {
              select: { id: true, name: true, email: true, urlId: true },
            },
          },
        })
      : Promise.resolve([]),
    viewType === 'content'
      ? prisma.contentReport.findMany({
          where: filterStatus ? { status: filterStatus } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            reporterUser: {
              select: { id: true, name: true, email: true, urlId: true },
            },
            file: {
              select: { id: true, name: true, urlPath: true, flagged: true },
            },
            url: {
              select: {
                id: true,
                shortCode: true,
                targetUrl: true,
                flagged: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ])

  const typeQuery = viewType !== 'user' ? `type=${viewType}` : ''
  const hrefFor = (s?: ReportStatus) => {
    const query = [typeQuery, s ? `status=${s}` : ''].filter(Boolean).join('&')
    return `/admin/reports${query ? `?${query}` : ''}`
  }
  const typeTabs = [
    { href: '/admin/reports', label: 'Users', active: viewType === 'user' },
    ...(cloudEnabled
      ? [
          {
            href: '/admin/reports?type=squad',
            label: 'Squads',
            active: viewType === 'squad',
          },
        ]
      : []),
    {
      href: '/admin/reports?type=content',
      label: 'Content',
      active: viewType === 'content',
    },
  ]
  const statusTabs = [
    { href: hrefFor(), label: 'All', active: !filterStatus },
    ...VALID_STATUSES.map((s) => ({
      href: hrefFor(s),
      label: humanize(s),
      active: filterStatus === s,
    })),
  ]
  const count =
    viewType === 'user'
      ? userReports.length
      : viewType === 'squad'
        ? squadReports.length
        : contentReports.length
  const noun = viewType === 'content' ? 'content' : viewType

  return (
    <AdminShell
      title="Reports"
      description="Review and resolve reports about users, squads and content."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LinkTabs options={typeTabs} label="Report type" />
        <LinkTabs options={statusTabs} label="Status" />
      </div>

      <Panel
        flush
        title={`${count} ${noun} ${count === 1 ? 'report' : 'reports'}`}
        description={
          filterStatus
            ? `Showing ${humanize(filterStatus).toLowerCase()} reports, newest first.`
            : 'Newest first. Showing up to 50.'
        }
      >
        {count === 0 ? (
          <EmptyState
            icon={Flag}
            title="Nothing to review"
            description={
              filterStatus
                ? `No ${humanize(filterStatus).toLowerCase()} ${noun} reports.`
                : `No one has reported any ${noun === 'content' ? 'content' : `${noun}s`} yet.`
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Reported</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Reported by
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewType === 'user' &&
                  userReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="pl-5">
                        <Person
                          name={report.reportedUser.name}
                          email={report.reportedUser.email}
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {humanize(report.category)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Person
                          name={report.reporterUser.name}
                          email={report.reporterUser.email}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={STATUS_TONES[report.status]}>
                          {humanize(report.status)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {report.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8"
                        >
                          <Link href={`/admin/reports/${report.id}`}>
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                {viewType === 'squad' &&
                  squadReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="pl-5">
                        <div className="text-sm font-medium">
                          {report.squad.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          /{report.squad.slug}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {humanize(report.category)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Person
                          name={report.reporterUser.name}
                          email={report.reporterUser.email}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={STATUS_TONES[report.status]}>
                          {humanize(report.status)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {report.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="pr-5" />
                    </TableRow>
                  ))}

                {viewType === 'content' &&
                  contentReports.map((report) => {
                    const contentName =
                      report.file?.name ?? report.url?.shortCode ?? '—'
                    const contentPath =
                      report.file?.urlPath ??
                      (report.url ? `/u/${report.url.shortCode}` : null)
                    const isFlagged =
                      report.file?.flagged ?? report.url?.flagged ?? false
                    return (
                      <TableRow key={report.id}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-2">
                            {contentPath ? (
                              <Link
                                href={contentPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-sm font-medium text-primary hover:underline"
                              >
                                {contentName}
                              </Link>
                            ) : (
                              <span className="text-sm">{contentName}</span>
                            )}
                            {isFlagged && (
                              <StatusBadge tone="danger">Flagged</StatusBadge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {humanize(report.contentType)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {humanize(report.category)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Person
                            name={report.reporterUser.name}
                            email={report.reporterUser.email}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone={STATUS_TONES[report.status]}>
                            {humanize(report.status)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                          {report.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="pr-5" />
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </AdminShell>
  )
}

function Person({
  name,
  email,
}: {
  name: string | null
  email: string | null
}) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium">{name ?? '—'}</div>
      {email && (
        <div className="truncate text-xs text-muted-foreground">{email}</div>
      )}
    </div>
  )
}
