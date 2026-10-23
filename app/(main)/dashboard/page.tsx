import Link from 'next/link'

import { getServerSession } from 'next-auth/next'
import { Clipboard, Upload } from 'lucide-react'

import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { prisma } from '@/packages/lib/database/prisma'
import { getEffectiveQuotaMB } from '@/packages/lib/storage/quota'
import { formatBytes } from '@/packages/lib/utils'
import { Button } from '@/packages/components/ui/button'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

import { DashboardIndex } from './client'

export const metadata = buildPageMetadata({
  title: 'Dashboard',
  description:
    'Your personal dashboard to manage uploads, settings, and account information.',
})

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const [fileCount, urlCount, recentFiles, recentUrls, quota] =
    await Promise.all([
      prisma.file.count({ where: { userId } }),
      prisma.shortenedUrl.count({ where: { userId } }),
      prisma.file.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          urlPath: true,
          mimeType: true,
          size: true,
          uploadedAt: true,
        },
      }),
      prisma.shortenedUrl.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          shortCode: true,
          targetUrl: true,
          clicks: true,
          createdAt: true,
        },
      }),
      getEffectiveQuotaMB(userId).catch(() => null),
    ])

  const mb = (v: number) => formatBytes(v * 1024 * 1024)
  // Unlimited plans report a 100 TB sentinel quota
  const unlimited = !quota || quota.quotaMB >= 100 * 1024 * 1024

  const firstName = (session!.user.name ?? '').split(' ')[0] || 'there'

  return (
    <DashboardShell
      title={`Welcome back, ${firstName}`}
      description="Here's what's happening with your account."
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/paste">
              <Clipboard className="mr-2 h-4 w-4" />
              New paste
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Link>
          </Button>
        </>
      }
    >
      <DashboardIndex
        fileCount={fileCount}
        urlCount={urlCount}
        storage={{
          used: mb(quota?.usedMB ?? 0),
          total: unlimited ? null : mb(quota!.quotaMB),
          percent: unlimited ? null : Math.min(100, quota!.percentageUsed),
        }}
        recentFiles={recentFiles.map((f) => ({
          ...f,
          size: mb(f.size),
          uploadedAt: f.uploadedAt.toISOString(),
        }))}
        recentUrls={recentUrls.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </DashboardShell>
  )
}
