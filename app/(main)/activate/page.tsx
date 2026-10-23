import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { ActivateDevice } from '@/packages/components/auth/activate-device'
import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { Icons } from '@/packages/components/shared/icons'
import { authOptions } from '@/packages/lib/auth'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Sign in to an app',
  description: 'Connect a desktop app such as Flicker to your Emberly account.',
})

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ code?: string }>
}

export default async function ActivatePage({ searchParams }: PageProps) {
  const { code } = await searchParams
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    const back = code
      ? `/activate?code=${encodeURIComponent(code)}`
      : '/activate'
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(back)}`)
  }

  return (
    <main className="relative min-h-[calc(100vh-57px)] overflow-hidden">
      <DynamicBackground />
      <div className="relative z-10 flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Icons.logo className="h-8 w-8 text-primary" />
            <span className="emberly-text text-2xl text-primary">Emberly</span>
          </div>
          <div className="glass-card p-8">
            <ActivateDevice
              initialCode={code ?? ''}
              accountName={
                session.user.name || session.user.email || 'your account'
              }
            />
          </div>
        </div>
      </div>
    </main>
  )
}
