import { DashboardWrapper } from '@/packages/components/dashboard/dashboard-wrapper'

import { getConfig } from '@/packages/lib/config'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Your personal dashboard to manage uploads, settings, and account information.',
})

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = await getConfig()
  const { value, unit } = config.settings.general.storage.maxUploadSize
  const maxSizeBytes =
    value * (unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024)

  return (
    <DashboardWrapper
      showFooter={config.settings.general.credits.showFooter}
      maxUploadSize={maxSizeBytes}
    >
      {children}
    </DashboardWrapper>
  )
}
