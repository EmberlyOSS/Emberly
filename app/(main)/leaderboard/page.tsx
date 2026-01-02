import { Leaderboard } from '@/packages/components/leaderboard'
import HomeShell from '@/packages/components/layout/home-shell'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Leaderboard | Emberly',
    description: 'Top contributors and power users in the Emberly community.',
  }

export default function LeaderboardPage() {
  return (
    <HomeShell>
      <Leaderboard />
    </HomeShell>
  )
}
