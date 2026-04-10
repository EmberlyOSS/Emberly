import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { DashboardWrapper } from '@/packages/components/dashboard/dashboard-wrapper'

import { authOptions } from '@/packages/lib/auth'
import { getConfig } from '@/packages/lib/config'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Admin',
  description: 'Administrative dashboard for managing Emberly settings and users.',
})

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    redirect('/dashboard')
  }

  const config = await getConfig()
  const { value, unit } = config.settings.general.storage.maxUploadSize
  const maxSizeBytes =
    value * (unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024)

  return (
    <DashboardWrapper
      showFooter={config.settings.general.credits.showFooter}
      maxUploadSize={maxSizeBytes}
    >
      <div className="container space-y-6">
        {children}
      </div>
    </DashboardWrapper>
  )
}
