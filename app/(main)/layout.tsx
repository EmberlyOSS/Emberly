import { Metadata } from 'next'

import ConditionalBaseNav from '@/components/layout/conditional-base-nav'
import FooterWrapper from '@/components/layout/footer-wrapper'

import { getConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Emberly',
  description:
    'File Sharing, Forged in Fire. Fast, private file sharing and short links designed for developers and teams. Upload files, set expirations, and point custom domains to Emberly to serve your content with confidence.',
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
