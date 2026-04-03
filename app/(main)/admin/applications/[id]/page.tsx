import Link from 'next/link'
import { notFound } from 'next/navigation'

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
    <div className="container space-y-6">
      <div className="glass-card">
        <div className="p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/admin/applications"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Applications
                </Link>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Review Application</h1>
              <p className="text-muted-foreground mt-2">
                Submitted {application.createdAt.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex gap-2">
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
        {/* Left column: applicant info + answers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant */}
          <div className="glass-card">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Applicant</h2>
              <div className="flex items-center gap-4">
                {application.user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={application.user.image}
                    alt={application.user.name ?? 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-medium">{application.user.name ?? '—'}</div>
                  <div className="text-sm text-muted-foreground">
                    {application.user.email}
                  </div>
                  {application.user.urlId && (
                    <Link
                      href={`/${application.user.urlId}`}
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
          <div className="glass-card">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Application Answers</h2>
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

          {/* Replies / Messages */}
          <div className="glass-card">
            <div className="p-6">
              <ApplicationReplies
                applicationId={application.id}
                disabled={application.status === 'WITHDRAWN'}
              />
            </div>
          </div>
        </div>

        {/* Right column: review panel */}
        <div className="space-y-6">
          {/* Review form */}
          <div className="glass-card">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Decision</h2>
              <ApplicationReviewForm
                applicationId={application.id}
                currentStatus={application.status}
                currentReviewNotes={application.reviewNotes}
              />
            </div>
          </div>

          {/* Existing review notes */}
          {application.reviewNotes && (
            <div className="glass-card">
              <div className="p-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Review Notes
                </h2>
                <p className="text-sm whitespace-pre-wrap">{application.reviewNotes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="glass-card">
            <div className="p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Details
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Application ID</dt>
                  <dd className="font-mono text-xs text-right break-all">{application.id}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd>{application.createdAt.toLocaleDateString()}</dd>
                </div>
                {application.reviewedAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Reviewed</dt>
                    <dd>{application.reviewedAt.toLocaleDateString()}</dd>
                  </div>
                )}
                {application.notes && (
                  <div className="pt-2 border-t border-border/30">
                    <dt className="text-muted-foreground mb-1">Internal Notes</dt>
                    <dd className="text-xs whitespace-pre-wrap">{application.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
