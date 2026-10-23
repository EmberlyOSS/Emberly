import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import ConditionalBaseNav from '@/components/layout/conditional-base-nav'
import FooterWrapper from '@/components/layout/footer-wrapper'
import { authOptions } from '@/lib/auth'
import { getConfig } from '@/lib/config'
import { isCloudEnabled } from '@/lib/config/env'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isCloudEnabled()) {
    const session = await getServerSession(authOptions)
    redirect(session?.user ? '/dashboard' : '/auth/login')
  }

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
