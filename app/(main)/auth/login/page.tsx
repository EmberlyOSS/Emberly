import { LoginForm } from '@/packages/components/auth/login-form'
import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { Icons } from '@/packages/components/shared/icons'

import { getConfig } from '@/packages/lib/config'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Login',
  description: 'Sign in to your Emberly account to manage your files and settings.',
})

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const config = await getConfig()
  const registrationsEnabled = config.settings.general.registrations.enabled

  return (
    <main className="relative min-h-[calc(100vh-57px)] overflow-hidden">
      <DynamicBackground />

      <div className="relative z-10 flex min-h-[calc(100vh-57px)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[400px] space-y-8">
          { }
          <div className="flex flex-col items-center justify-center">
            <div className="glass-card">
              <div className="flex items-center justify-center space-x-3 px-6 py-4">
                <Icons.logo className="h-8 w-8 text-primary" />
                <span className="emberly-text text-2xl text-primary">
                  Emberly
                </span>
              </div>
            </div>
          </div>

          { }
          <div className="glass-card">
            <div className="p-8">
              <LoginForm
                registrationsEnabled={registrationsEnabled}
                disabledMessage={
                  config.settings.general.registrations.disabledMessage
                }
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
