import { Leaderboard } from '@/packages/components/leaderboard'
import PageShell from '@/packages/components/layout/PageShell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Leaderboard',
  description:
    'Top contributors, Discovery profiles and squads in the Emberly community.',
})

export default function LeaderboardPage() {
  return (
    <PageShell
      eyebrow="Community"
      title="Leaderboard"
      subtitle="The most active contributors, Discovery profiles and squads in the community."
    >
      <Leaderboard />
    </PageShell>
  )
}
