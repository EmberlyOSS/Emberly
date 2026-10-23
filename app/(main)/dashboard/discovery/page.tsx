import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'
import Link from 'next/link'

import { authOptions } from '@/packages/lib/auth'
import { isCloudEnabled } from '@/packages/lib/config/env'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { prisma } from '@/packages/lib/database/prisma'

import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'
import { ArrowUpRight } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { NexiumDashboardClient } from './client'

export const metadata = buildPageMetadata({
  title: 'Discovery',
  description:
    'Manage your talent profile, squads, signals, and team resources.',
})

export default async function NexiumDashboardPage() {
  if (!isCloudEnabled()) redirect('/dashboard')

  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, urlId: true, isProfilePublic: true },
  })

  return (
    <DashboardShell
      title="Discovery"
      description="Manage your talent profile, squads, signals, and team resources"
      actions={
        <>
          {user?.isProfilePublic && (
            <Button asChild size="sm">
              <Link href={`/user/${user.name}`}>
                View public profile
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href="/me">Profile settings</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/applications">Applications</Link>
          </Button>
        </>
      }
    >
      <NexiumDashboardClient />
    </DashboardShell>
  )
}
