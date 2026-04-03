import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Your personal dashboard to manage uploads, settings, and account information.',
})

import { DashboardClient } from './client'

export default async function DashboardPage() {

  return <DashboardClient />
}
