import Link from 'next/link'

import { AdminShell } from '@/packages/components/admin/admin-shell'
import { Badge } from '@/packages/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/packages/components/ui/table'
import { prisma } from '@/packages/lib/database/prisma'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { ReportStatus } from '@/prisma/generated/prisma/client'

export const metadata = buildPageMetadata({
  title: 'Reports',
  description: 'Review and resolve user and squad reports.',
})

const STATUS_STYLES: Record<ReportStatus, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  REVIEWING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  RESOLVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  DISMISSED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const VALID_STATUSES = ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const { status, type } = await searchParams
  const filterStatus =
    VALID_STATUSES.includes(status as ReportStatus)
      ? (status as ReportStatus)
      : undefined

  const viewType = type === 'squad' ? 'squad' : type === 'content' ? 'content' : 'user'

  const [userReports, squadReports, contentReports] = await Promise.all([
    viewType === 'user'
      ? prisma.userReport.findMany({
          where: filterStatus ? { status: filterStatus } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            reportedUser: {
              select: { id: true, name: true, email: true, urlId: true, image: true },
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
              select: { id: true, shortCode: true, targetUrl: true, flagged: true },
            },
          },
        })
      : Promise.resolve([]),
  ])

  return (
    <AdminShell header={
      <div className="glass-card">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Review and resolve user and squad reports
          </p>
        </div>
      </div>
    }>
      <div>
          {/* Type tabs */}
          <div className="flex gap-2 mb-4">
            <Link
              href="/admin/reports"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              User Reports
            </Link>
            <Link
              href="/admin/reports?type=squad"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType === 'squad'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Squad Reports
            </Link>
            <Link
              href="/admin/reports?type=content"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType === 'content'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Content Reports
            </Link>
          </div>

          {/* Status filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {([undefined, ...VALID_STATUSES] as const).map((s) => {
              const typeParam = viewType !== 'user' ? `type=${viewType}` : ''
              const statusParam = s ? `status=${s}` : ''
              const query = [typeParam, statusParam].filter(Boolean).join('&')
              return (
                <Link
                  key={s ?? 'all'}
                  href={`/admin/reports${query ? `?${query}` : ''}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {s ?? 'All'}
                </Link>
              )
            })}
          </div>

          {viewType === 'user' ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {userReports.length} user report{userReports.length !== 1 ? 's' : ''}
                {filterStatus ? ` with status "${filterStatus}"` : ''}
              </p>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reported User</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {userReports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No user reports found
                  </TableCell>
                </TableRow>
              ) : (
                userReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {report.id.slice(0, 8)}&hellip;
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {report.reporterUser.name ?? '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {report.reporterUser.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {report.reportedUser.name ?? '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {report.reportedUser.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs capitalize">
                        {report.category.toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={STATUS_STYLES[report.status]}
                        variant="outline"
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {report.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/reports/${report.id}`}
                          className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          View
                        </Link>
                        {report.reportedUser.urlId && (
                          <Link
                            href={`/${report.reportedUser.urlId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                          >
                            Profile ↗
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
            </>
          ) : viewType === 'squad' ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {squadReports.length} squad report{squadReports.length !== 1 ? 's' : ''}
                {filterStatus ? ` with status "${filterStatus}"` : ''}
              </p>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Squad</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {squadReports.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No squad reports found
                      </TableCell>
                    </TableRow>
                  ) : (
                    squadReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {report.id.slice(0, 8)}&hellip;
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {report.reporterUser.name ?? '—'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {report.reporterUser.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {report.squad.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            /{report.squad.slug}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs capitalize">
                            {report.category.toLowerCase().replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={STATUS_STYLES[report.status]}
                            variant="outline"
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {report.createdAt.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {contentReports.length} content report{contentReports.length !== 1 ? 's' : ''}
                {filterStatus ? ` with status "${filterStatus}"` : ''}
              </p>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Flagged</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentReports.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        No content reports found
                      </TableCell>
                    </TableRow>
                  ) : (
                    contentReports.map((report) => {
                      const contentName = report.file?.name ?? report.url?.shortCode ?? '—'
                      const contentPath = report.file?.urlPath ?? (report.url ? `/u/${report.url.shortCode}` : null)
                      const isFlagged = report.file?.flagged ?? report.url?.flagged ?? false
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {report.id.slice(0, 8)}&hellip;
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {report.reporterUser.name ?? '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {report.reporterUser.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {report.contentType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {contentPath ? (
                              <Link
                                href={contentPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                {contentName}
                              </Link>
                            ) : (
                              <span className="text-sm">{contentName}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs capitalize">
                              {report.category.toLowerCase().replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={STATUS_STYLES[report.status]}
                              variant="outline"
                            >
                              {report.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isFlagged ? (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30" variant="outline">
                                Flagged
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {report.createdAt.toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </div>
    </AdminShell>
  )
}
