import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
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
    <AdminShell header={
      <div className="glass-card overflow-hidden gradient-border-animated">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Admin <span className="text-gradient">Overview</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Platform administration and management.
          </p>
        </div>
      </div>
    }>
      <AdminOverviewContent
        userCount={userCount}
        fileCount={fileCount}
        pendingReports={reportCount}
        pendingApplications={applicationCount}
        isSuperAdmin={isSuperAdmin}
      />
    </AdminShell>
  )
}
