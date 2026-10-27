import { LicensesView } from '@/components/licenses/licenses-view'
import PageShell from '@/components/layout/PageShell'

import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Licenses',
  description:
    'Emberly’s license, and the open-source software it’s built with.',
})

export default function LicensesPage() {
  return (
    <PageShell
      eyebrow="Resources"
      title="Licenses"
      subtitle="Emberly’s license, and the open-source software it’s built with."
    >
      <LicensesView />
    </PageShell>
  )
}
