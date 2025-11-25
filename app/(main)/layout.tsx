import { Metadata } from 'next'

import ConditionalBaseNav from '@/components/layout/conditional-base-nav'
import FooterWrapper from '@/components/layout/footer-wrapper'

import { getConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Emberly',
  description: 'A free, modern, open source file upload platform',
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
