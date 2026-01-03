import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { CustomHead } from '@/packages/components/layout/custom-head'
import { AuthProvider } from '@/packages/components/providers/auth-provider'
import { QueryProvider } from '@/packages/components/providers/query-provider'
import { ThemeProviderWrapper } from '@/packages/components/providers/theme-provider-wrapper'
import { SetupChecker } from '@/packages/components/setup-checker'
import { ThemeInitializer } from '@/packages/components/theme/theme-initializer'
import { ThemeProvider } from '@/packages/components/theme/theme-provider'
import { ThemeEffectsWrapper } from '@/packages/components/theme/theme-effects-wrapper'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { Toaster } from '@/packages/components/ui/toaster'
import Snowfall from '@/packages/components/theme/snowfall'

import { getConfig } from '@/packages/lib/config'

import './globals.css'

const inter = localFont({
  src: [
    {
      path: '../public/fonts/inter/Inter-VariableFont_opsz,wght.ttf',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../public/fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf',
      weight: '100 900',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://emberly.ca'),
  title: null,
  description: null,
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = await getConfig()
  const customCSS = config.settings.advanced?.customCSS || ''
  const hasCustomFont = typeof customCSS === 'string' ? customCSS.includes('font-family') : false

  if (config.settings.appearance.favicon) {
    metadata.icons = {
      icon: [
        { url: '/api/favicon', type: 'image/png', sizes: '32x32' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
    }
  }

  // If user is authenticated, fetch their theme so we can server-render it
  const session = await getServerSession(authOptions)
  let userTheme: string | null = null
  let userCustomColors: Record<string, string> | null = null

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true, customColors: true },
    })
    userTheme = user?.theme ?? null
    userCustomColors = (user?.customColors as Record<string, string>) ?? null
  }

  return (
    <html lang="en" data-theme={userTheme ?? config.settings.appearance.theme} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script async src="https://ackee.bytebrush.dev/tracker.js" data-ackee-server="https://ackee.bytebrush.dev" data-ackee-domain-id="fee82036-9b66-4760-976e-af630cc35974"></script>
        <ThemeInitializer userTheme={userTheme} userCustomColors={userCustomColors} />
        <CustomHead />
      </head>
      <body suppressHydrationWarning className={`${!hasCustomFont ? inter.variable + ' font-sans' : ''} min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme={config.settings.appearance.systemThemes as string | undefined}
          enableSystem
          disableTransitionOnChange
        >
          <ThemeProviderWrapper
            initialUserTheme={userTheme}
            initialUserColors={userCustomColors}
            systemTheme={config.settings.appearance.theme}
            systemColors={config.settings.appearance.customColors}
          >
            <Snowfall />
            <div id="theme-effects-root" className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ width: '100vw', height: '100vh', top: 0, left: 0 }} suppressHydrationWarning />
            <QueryProvider>
              <AuthProvider>
                <SetupChecker>
                  <ThemeEffectsWrapper>
                    <div className="flex-1">{children}</div>
                  </ThemeEffectsWrapper>
                </SetupChecker>
              </AuthProvider>
            </QueryProvider>
            <div suppressHydrationWarning>
              <Toaster />
            </div>
          </ThemeProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}