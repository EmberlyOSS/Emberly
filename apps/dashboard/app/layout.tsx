import { appUrl } from '@/lib/config/env'
import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { CustomHead } from '@/components/layout/custom-head'
import { AuthProvider } from '@/components/providers/auth-provider'
import { FeaturesProvider } from '@/components/providers/features-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProviderWrapper } from '@/components/providers/theme-provider-wrapper'
import { SetupChecker } from '@/components/setup-checker'
import Snowfall from '@/components/theme/snowfall'
import {
  ThemeEffectsContainer,
  ThemeEffectsWrapper,
} from '@/components/theme/theme-effects-wrapper'
import { ThemeInitializer } from '@/components/theme/theme-initializer'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { authOptions } from '@/lib/auth'
import { getConfig } from '@/lib/config'
import { getFeatures } from '@/lib/features'
import { prisma } from '@emberly/db'
import { upgradeLegacyDefaultColors } from '@/lib/theme/presets'
import { getServerSession } from 'next-auth'

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

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig()
  const siteName = config.settings.general.siteName || 'Emberly'
  const description = config.settings.general.metaDescription || undefined

  return {
    metadataBase: new URL(
      appUrl()
    ),
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    icons: config.settings.appearance.favicon
      ? {
          icon: [
            { url: '/api/favicon', type: 'image/png', sizes: '32x32' },
            { url: '/favicon.svg', type: 'image/svg+xml' },
          ],
          apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
        }
      : {
          icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
          apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
          shortcut: '/favicon.svg',
        },
    manifest: '/manifest.webmanifest',
  }
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = await getConfig()
  const features = await getFeatures()
  const customCSS = config.settings.advanced?.customCSS || ''
  const hasCustomFont =
    typeof customCSS === 'string' ? customCSS.includes('font-family') : false

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
    userCustomColors = upgradeLegacyDefaultColors(
      (user?.customColors as Record<string, string>) ?? null
    )
  }

  const defaultTheme =
    typeof config.settings.appearance.theme === 'string'
      ? config.settings.appearance.theme
      : 'default-dark'
  const systemColors = upgradeLegacyDefaultColors(
    typeof config.settings.appearance.customColors === 'object' &&
      config.settings.appearance.customColors
      ? config.settings.appearance.customColors
      : {}
  )

  return (
    <html
      lang="en"
      data-theme={userTheme ?? defaultTheme}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ThemeInitializer
          userTheme={userTheme}
          userCustomColors={userCustomColors}
          systemTheme={defaultTheme}
          systemColors={systemColors}
        />
        <CustomHead />
      </head>
      <body
        suppressHydrationWarning
        className={`${!hasCustomFont ? inter.variable + ' font-sans' : ''} min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          enableSystem={false}
          enableColorScheme={false}
          storageKey=""
          disableTransitionOnChange
        >
          <ThemeProviderWrapper
            initialUserTheme={userTheme}
            initialUserColors={userCustomColors}
            systemTheme={defaultTheme}
            systemColors={systemColors}
          >
            <Snowfall />
            <ThemeEffectsContainer />
            <QueryProvider>
              <AuthProvider>
                <FeaturesProvider features={features}>
                  <SetupChecker>
                    <ThemeEffectsWrapper>
                      <div className="flex-1">{children}</div>
                    </ThemeEffectsWrapper>
                  </SetupChecker>
                </FeaturesProvider>
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
