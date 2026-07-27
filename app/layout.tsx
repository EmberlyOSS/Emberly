import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { CustomHead } from '@/packages/components/layout/custom-head'
import { AuthProvider } from '@/packages/components/providers/auth-provider'
import { QueryProvider } from '@/packages/components/providers/query-provider'
import { ThemeProviderWrapper } from '@/packages/components/providers/theme-provider-wrapper'
import { SetupChecker } from '@/packages/components/setup-checker'
import Snowfall from '@/packages/components/theme/snowfall'
import {
  ThemeEffectsContainer,
  ThemeEffectsWrapper,
} from '@/packages/components/theme/theme-effects-wrapper'
import { ThemeInitializer } from '@/packages/components/theme/theme-initializer'
import { ThemeProvider } from '@/packages/components/theme/theme-provider'
import { Toaster } from '@/packages/components/ui/toaster'
import { authOptions } from '@/packages/lib/auth'
import { getConfig } from '@/packages/lib/config'
import { prisma } from '@/packages/lib/database/prisma'
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
      process.env.NEXT_PUBLIC_BASE_URL || 'https://embrly.ca'
    ),
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    icons: config.settings.appearance.favicon
      ? {
          icon: [
            { url: '/api/favicon', type: 'image/png', sizes: '32x32' },
            { url: '/icon.svg', type: 'image/svg+xml' },
          ],
        }
      : {
          icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
          apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
          shortcut: '/icon.svg',
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
    userCustomColors = (user?.customColors as Record<string, string>) ?? null
  }

  const defaultTheme =
    typeof config.settings.appearance.theme === 'string'
      ? config.settings.appearance.theme
      : 'default-dark'
  const systemColors =
    typeof config.settings.appearance.customColors === 'object' &&
    config.settings.appearance.customColors
      ? config.settings.appearance.customColors
      : {}

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
