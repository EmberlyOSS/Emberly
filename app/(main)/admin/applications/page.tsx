import Link from 'next/link'

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
import { ApplicationStatus, ApplicationType } from '@/prisma/generated/prisma/client'

export const metadata = buildPageMetadata({
  title: 'Applications',
  description: 'Review and manage user applications.',
})

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  REVIEWING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
  WITHDRAWN: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const TYPE_STYLES: Record<ApplicationType, string> = {
  STAFF: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  PARTNER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  VERIFICATION: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  BAN_APPEAL: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const VALID_STATUSES = ['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'WITHDRAWN'] as const
const VALID_TYPES = ['STAFF', 'PARTNER', 'VERIFICATION', 'BAN_APPEAL'] as const

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

  const applications = await prisma.application.findMany({
    where: {
      ...(filterStatus && { status: filterStatus }),
      ...(filterType && { type: filterType }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { id: true, name: true, email: true, urlId: true, image: true } },
    },
  })

  const buildUrl = (params: { status?: string; type?: string }) => {
    const q = new URLSearchParams()
    if (params.status) q.set('status', params.status)
    if (params.type) q.set('type', params.type)
    const qs = q.toString()
    return `/admin/applications${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="container space-y-6">
      <div className="glass-card">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage staff, partner, verification, and ban appeal applications
          </p>
        </div>
      </div>

      <div>
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
                Status
              </p>
              <div className="flex gap-2 flex-wrap">
                {([undefined, ...VALID_STATUSES] as const).map((s) => (
                  <Link
                    key={s ?? 'all-status'}
                    href={buildUrl({ status: s, type: filterType })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {s ?? 'All'}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
                Type
              </p>
              <div className="flex gap-2 flex-wrap">
                {([undefined, ...VALID_TYPES] as const).map((t) => (
                  <Link
                    key={t ?? 'all-type'}
                    href={buildUrl({ status: filterStatus, type: t })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterType === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {t?.replace('_', ' ') ?? 'All'}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Showing {applications.length} application{applications.length !== 1 ? 's' : ''}
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{app.user.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{app.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={TYPE_STYLES[app.type]} variant="outline">
                        {app.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLES[app.status]} variant="outline">
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {app.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        Review
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
    </div>
  )
}
