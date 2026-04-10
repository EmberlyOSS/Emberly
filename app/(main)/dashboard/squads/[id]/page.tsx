import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

import { SquadDashboardClient } from './client'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const squad = await prisma.nexiumSquad.findUnique({
    where: { id },
    select: { name: true },
  })
  return buildPageMetadata({
    title: squad ? `${squad.name} — Squad` : 'Squad Dashboard',
    description: 'Manage your Discovery squad.',
  })
}

export default async function SquadDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  const { id } = await params

  // Verify membership
  const membership = await prisma.nexiumSquadMember.findUnique({
    where: { squadId_userId: { squadId: id, userId: session.user.id } },
    select: { role: true },
  })

  if (!membership) redirect('/dashboard/squads')

  return <SquadDashboardClient squadId={id} role={membership.role} />
}
