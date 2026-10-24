import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { NotificationsClient } from '@/components/notifications/notifications-client'

import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Notifications',
  description: 'Everything Emberly has told you about your account.',
})

export default function NotificationsPage() {
  return (
    <DashboardShell
      title="Notifications"
      description="Sign-ins, account changes and updates about your files"
    >
      <NotificationsClient />
    </DashboardShell>
  )
}
