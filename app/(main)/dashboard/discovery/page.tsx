import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

import { NexiumDashboardClient } from './client'

export const metadata = buildPageMetadata({
  title: 'Discovery Dashboard',
  description: 'Manage your Discovery squads, talent profile, and integrations.',
})

export default async function NexiumDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  return <NexiumDashboardClient />
}
