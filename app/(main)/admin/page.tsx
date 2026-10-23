import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { isCloudEnabled } from '@/packages/lib/config/env'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { prisma } from '@/packages/lib/database/prisma'

import { AdminOverviewContent } from './overview-client'
import { AdminShell } from '@/packages/components/admin/admin-shell'

export const metadata = buildPageMetadata({
  title: 'Admin Overview',
  description: 'Administrative dashboard overview.',
})

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  const isSuperAdmin = session?.user?.role === 'SUPERADMIN'

  const [userCount, fileCount, reportCount, applicationCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.file.count(),
      prisma.userReport.count({ where: { status: 'PENDING' } }).catch(() => 0),
      prisma.application.count({ where: { status: 'PENDING' } }),
    ])

  return (
    <AdminShell
      title="Admin Overview"
      description="Platform administration and management."
    >
      <AdminOverviewContent
        userCount={userCount}
        fileCount={fileCount}
        pendingReports={reportCount}
        pendingApplications={applicationCount}
        isSuperAdmin={isSuperAdmin}
        cloudEnabled={isCloudEnabled()}
      />
    </AdminShell>
  )
}
