import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ClipboardList, Clock, FileSearch } from 'lucide-react'

import { AdminShell } from '@/packages/components/admin/admin-shell'
import { Badge } from '@/packages/components/ui/badge'
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

  const [applications, counts] = await Promise.all([
    prisma.application.findMany({
      where: {
        ...(filterStatus && { status: filterStatus }),
        ...(filterType && { type: filterType }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true, urlId: true, image: true } },
      },
    }),
    prisma.application.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]))
  const pendingCount = countByStatus['PENDING'] ?? 0
  const reviewingCount = countByStatus['REVIEWING'] ?? 0

  const buildUrl = (params: { status?: string; type?: string }) => {
    const q = new URLSearchParams()
    if (params.status) q.set('status', params.status)
    if (params.type) q.set('type', params.type)
    const qs = q.toString()
    return `/admin/applications${qs ? `?${qs}` : ''}`
  }

  return (
    <AdminShell header={
      <div className="glass-card overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                <p className="text-muted-foreground mt-1">
                  Review and manage staff, partner, verification, and ban appeal applications
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="glass-subtle rounded-xl px-4 py-3 flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-yellow-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold leading-none">{pendingCount}</p>
                </div>
              </div>
              <div className="glass-subtle rounded-xl px-4 py-3 flex items-center gap-2.5">
                <FileSearch className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Reviewing</p>
                  <p className="text-lg font-bold leading-none">{reviewingCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Status</p>
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
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Type</p>
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

      {/* Results */}
      <p className="text-sm text-muted-foreground">
        Showing {applications.length} application{applications.length !== 1 ? 's' : ''}
      </p>

      {applications.length === 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="p-12 flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-xl bg-muted/30">
              <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">No applications found for the selected filters.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="glass-card overflow-hidden glass-hover">
              <div className="p-5 flex items-center gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {app.user.image ? (
                    <Image
                      src={app.user.image}
                      alt={app.user.name ?? 'User'}
                      width={44}
                      height={44}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                      {(app.user.name ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{app.user.name ?? '—'}</span>
                    <Badge className={TYPE_STYLES[app.type]} variant="outline">
                      {app.type.replace('_', ' ')}
                    </Badge>
                    <Badge className={STATUS_STYLES[app.status]} variant="outline">
                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{app.user.email}</p>
                </div>

                {/* Date + action */}
                <div className="shrink-0 flex items-center gap-4">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {app.createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    Review
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
