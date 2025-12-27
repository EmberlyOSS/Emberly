import { Metadata } from 'next'

import ConditionalBaseNav from '@/packages/components/layout/conditional-base-nav'
import FooterWrapper from '@/packages/components/layout/footer-wrapper'

import { getConfig } from '@/packages/lib/config'
import { buildSiteMetadata } from '@/packages/lib/embeds/metadata'

export async function generateMetadata(): Promise<Metadata> {
  return buildSiteMetadata()
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = await getConfig()
  const showFooter = config.settings.general.credits.showFooter

  return (
    <div className="min-h-screen flex flex-col">
      <ConditionalBaseNav />
      <main className="flex-1">{children}</main>
      <FooterWrapper showFooter={showFooter} />
    </div>
  )
}
