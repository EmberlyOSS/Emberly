import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, ClipboardCheck, Hash, MessageSquare } from 'lucide-react'

import { AdminShell } from '@/packages/components/admin/admin-shell'
import { ApplicationReviewForm } from '@/packages/components/admin/applications/review-form'
import { ApplicationReplies } from '@/packages/components/applications/application-replies'
import { Badge } from '@/packages/components/ui/badge'
import { prisma } from '@/packages/lib/database/prisma'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { ApplicationStatus, ApplicationType } from '@/prisma/generated/prisma/client'

export const metadata = buildPageMetadata({
  title: 'Review Application',
  description: 'Review and process a user application.',
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

const TYPE_LABELS: Record<ApplicationType, string> = {
  STAFF: 'Staff',
  PARTNER: 'Partner',
  VERIFICATION: 'Verification',
  BAN_APPEAL: 'Ban Appeal',
}

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, urlId: true, image: true } },
    },
  })

  if (!application) notFound()

  const answers = application.answers as Record<string, unknown>

  return (
    <AdminShell>
      {/* Header */}
      <div className="glass-card overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-accent" />
        <div className="p-8">
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Applications
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 border border-primary/30 shrink-0">
                <ClipboardCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Review Application</h1>
                <p className="text-muted-foreground mt-1">
                  Submitted {application.createdAt.toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge className={TYPE_STYLES[application.type]} variant="outline">
                {TYPE_LABELS[application.type]}
              </Badge>
              <Badge className={STATUS_STYLES[application.status]} variant="outline">
                {application.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: applicant info + answers + replies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant */}
          <div className="glass-card overflow-hidden">
            <div className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Applicant</h2>
              <div className="flex items-center gap-4">
                {application.user.image ? (
                  <Image
                    src={application.user.image}
                    alt={application.user.name ?? 'User'}
                    width={52}
                    height={52}
                    className="rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-[52px] h-[52px] rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-primary shrink-0">
                    {(application.user.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-lg">{application.user.name ?? '—'}</div>
                  <div className="text-sm text-muted-foreground">{application.user.email}</div>
                  {application.user.urlId && (
                    <Link
                      href={`/user/${application.user.urlId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View profile ↗
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Answers */}
          <div className="glass-card overflow-hidden">
            <div className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Application Answers</h2>
              {Object.keys(answers).length === 0 ? (
                <p className="text-sm text-muted-foreground">No answers provided.</p>
              ) : (
                <dl className="space-y-4">
                  {Object.entries(answers).map(([key, value]) => (
                    <div key={key} className="border-b border-border/30 pb-4 last:border-0 last:pb-0">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                      </dt>
                      <dd className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {value === null || value === undefined
                          ? <span className="text-muted-foreground italic">—</span>
                          : typeof value === 'object'
                            ? <pre className="text-xs bg-muted/30 rounded p-2 overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                            : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>

          {/* Replies */}
          <div className="glass-card overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Messages</h2>
              </div>
              <ApplicationReplies
                applicationId={application.id}
                disabled={application.status === 'WITHDRAWN'}
              />
            </div>
          </div>
        </div>

        {/* Right column: decision + metadata */}
        <div className="space-y-6">
          {/* Review form */}
          <div className="glass-card overflow-hidden">
            <div className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Decision</h2>
              <ApplicationReviewForm
                applicationId={application.id}
                currentStatus={application.status}
                currentReviewNotes={application.reviewNotes}
                applicationType={application.type}
              />
            </div>
          </div>

          {/* Review notes (if set) */}
          {application.reviewNotes && (
            <div className="glass-card overflow-hidden">
              <div className="p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Review Notes</h2>
                <p className="text-sm whitespace-pre-wrap">{application.reviewNotes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="glass-card overflow-hidden">
            <div className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Details</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Application ID</dt>
                    <dd className="font-mono text-xs break-all">{application.id}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Submitted</dt>
                    <dd className="text-sm">{application.createdAt.toLocaleDateString()}</dd>
                  </div>
                </div>
                {application.reviewedAt && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <dt className="text-xs text-muted-foreground">Reviewed</dt>
                      <dd className="text-sm">{application.reviewedAt.toLocaleDateString()}</dd>
                    </div>
                  </div>
                )}
                {application.notes && (
                  <div className="pt-2 border-t border-border/30">
                    <dt className="text-xs text-muted-foreground mb-1">Internal Notes</dt>
                    <dd className="text-xs whitespace-pre-wrap">{application.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
