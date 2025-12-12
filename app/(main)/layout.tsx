import { Metadata } from 'next'

import ConditionalBaseNav from '@/components/layout/conditional-base-nav'
import FooterWrapper from '@/components/layout/footer-wrapper'

import { getConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Emberly',
  description: 'Emberly focuses on a simple, predictable file hosting experience with features that matter: expirations, custom domains, usage controls, and privacy-first defaults.',
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
