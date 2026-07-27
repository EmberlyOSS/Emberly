import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { AlertTriangle, Clock, Key, Server } from 'lucide-react'

import { authOptions } from '@/packages/lib/auth'
import { isCloudEnabled } from '@/packages/lib/config/env'
import { prisma } from '@/packages/lib/database/prisma'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { provisionBucketForUserSubscription } from '@/packages/lib/storage/bucket-provisioning'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'
import { BucketSecretReveal } from '@/packages/components/dashboard/bucket-secret-reveal'

export const metadata = buildPageMetadata({
  title: 'Storage Bucket',
  description: 'View your dedicated S3 storage bucket credentials and status.',
})

export default async function BucketPage() {
  if (!isCloudEnabled()) redirect('/dashboard')

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      storageBucket: {
        select: {
          id: true,
          name: true,
          provider: true,
          s3Bucket: true,
          s3Region: true,
          s3AccessKeyId: true,
          s3SecretKey: true,
          s3Endpoint: true,
          s3ForcePathStyle: true,
        },
      },
      subscriptions: {
        where: {
          stripeSubscriptionId: { not: null },
          status: { in: ['active', 'trialing', 'past_due'] },
          product: {
            slug: {
              startsWith: 'storage-bucket',
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          stripeSubscriptionId: true,
          metadata: true,
          product: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  })

  let bucket = user?.storageBucket
  const activeStorageSub = user?.subscriptions?.[0]
  const hasStorageSubscription = Boolean(activeStorageSub)
  let autoProvisionFailed = false

  if (!bucket && user && activeStorageSub?.stripeSubscriptionId) {
    const metadata = (activeStorageSub.metadata || {}) as Record<
      string,
      unknown
    >
    const region =
      typeof metadata.location === 'string' ? metadata.location : null
    const tierFromMetadata =
      typeof metadata.tier === 'string' ? metadata.tier : null
    const tierFromSlug =
      activeStorageSub.product.slug?.replace('storage-bucket-', '') || null

    try {
      await provisionBucketForUserSubscription({
        userId: user.id,
        email: user.email,
        name: user.name,
        stripeSubscriptionId: activeStorageSub.stripeSubscriptionId,
        region,
        tierSlug: tierFromMetadata || tierFromSlug,
      })

      const refreshedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          storageBucket: {
            select: {
              id: true,
              name: true,
              provider: true,
              s3Bucket: true,
              s3Region: true,
              s3AccessKeyId: true,
              s3SecretKey: true,
              s3Endpoint: true,
              s3ForcePathStyle: true,
            },
          },
        },
      })

      bucket = refreshedUser?.storageBucket || null
    } catch {
      autoProvisionFailed = true
    }
  }

  if (!bucket) {
    return (
      <DashboardShell
        header={
          <div className="glass-card">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-primary/20">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Storage Bucket
                </h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Dedicated S3-compatible storage with unlimited capacity.
              </p>
            </div>
          </div>
        }
      >
        {/* No bucket assigned */}
        <div className="glass-card">
          <div className="p-10 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-muted/50">
              <Server className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-lg font-semibold">No bucket assigned yet</p>
              {hasStorageSubscription ? (
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Your storage subscription is active, but your bucket
                  credentials are not visible yet.
                  {autoProvisionFailed
                    ? ' Automatic provisioning is still pending. Please refresh in a minute, and contact support if it remains unavailable.'
                    : ' We attempted automatic provisioning for this page load. Please refresh in a few seconds.'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  You don&apos;t have a dedicated storage bucket assigned to
                  your account. Purchase the Storage Bucket add-on on the{' '}
                  <a
                    href="/pricing#user-add-ons"
                    className="text-primary underline underline-offset-2"
                  >
                    pricing page
                  </a>{' '}
                  to instantly provision your bucket.
                </p>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      header={
        <div className="glass-card">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Storage Bucket
                </h1>
                <p className="text-sm text-muted-foreground">{bucket.name}</p>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Your dedicated S3-compatible bucket. All storage quotas and upload
              size limits are removed while your subscription is active.
            </p>
          </div>
        </div>
      }
    >
      {/* Coming soon notice */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/40 bg-blue-500/10 px-5 py-4 text-sm text-blue-700 dark:text-blue-400">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Direct S3 credential access is coming soon. In the meantime, your
          connection credentials were delivered by email when your bucket was
          assigned. Contact{' '}
          <a
            href="mailto:support@embrly.ca"
            className="underline underline-offset-2"
          >
            support@embrly.ca
          </a>{' '}
          if you need them resent.
        </span>
      </div>

      {/* Secret key reveal */}
      {bucket.s3SecretKey && (
        <div className="glass-card">
          <div className="p-6 border-b border-border/40 flex items-center gap-3">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Secret Access Key</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 mb-4">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Never share your secret key. If you believe it has been
                compromised, contact support immediately.
              </span>
            </div>
            <BucketSecretReveal secret={bucket.s3SecretKey} />
          </div>
        </div>
      )}

      {/* Help */}
      <div className="glass-card">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-3">Need help?</h2>
          <p className="text-sm text-muted-foreground">
            For troubleshooting or to rotate your access key, contact{' '}
            <a
              href="mailto:support@embrly.ca"
              className="text-primary underline underline-offset-2"
            >
              support@embrly.ca
            </a>
            .
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
