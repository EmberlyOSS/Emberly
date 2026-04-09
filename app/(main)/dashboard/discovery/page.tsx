import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'
import Link from 'next/link'

import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { prisma } from '@/packages/lib/database/prisma'

import { LogoutButton } from '../profile/logout-button'
import { NexiumDashboardClient } from './client'

export const metadata = buildPageMetadata({
  title: 'Discovery',
  description: 'Manage your talent profile, squads, signals, and team resources.',
})

export default async function NexiumDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, urlId: true, isProfilePublic: true },
  })

  return (
    <div className="container space-y-6">
      <div className="glass-card">
        <div className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Discovery</h1>
              <p className="text-muted-foreground mt-2">
                Manage your talent profile, squads, signals, and team resources
              </p>
              <div className="flex gap-3 mt-4 flex-wrap">
                {user?.isProfilePublic && (
                  <Link
                    href={`/user/${user.name}`}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    View Public Profile ↗
                  </Link>
                )}
                <Link
                  href="/dashboard/profile"
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Profile Settings ↗
                </Link>
                <Link
                  href="/applications"
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Applications ↗
                </Link>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>

      <NexiumDashboardClient />
    </div>
  )
}
