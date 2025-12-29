import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { CustomHead } from '@/packages/components/layout/custom-head'
import { AuthProvider } from '@/packages/components/providers/auth-provider'
import { QueryProvider } from '@/packages/components/providers/query-provider'
import { SetupChecker } from '@/packages/components/setup-checker'
import { ThemeInitializer } from '@/packages/components/theme/theme-initializer'
import { ThemeProvider } from '@/packages/components/theme/theme-provider'
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'),
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
  const hasCustomFont =
    config.settings.advanced.customCSS.includes('font-family')

  if (config.settings.appearance.favicon) {
    metadata.icons = {
      icon: [
        { url: '/api/favicon', type: 'image/png', sizes: '32x32' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
    }
  }

  return (
    <html lang="en" suppressHydrationWarning data-theme={config.settings.appearance.theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ThemeInitializer />
        <CustomHead />
      </head>
      <body
        suppressHydrationWarning
        className={`${!hasCustomFont ? inter.variable + ' font-sans' : ''} min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={config.settings.appearance.theme}
          enableSystem
          disableTransitionOnChange
        >
          <Snowfall />
          <QueryProvider>
            <AuthProvider>
              <SetupChecker>
                <div className="flex-1">{children}</div>
              </SetupChecker>
            </AuthProvider>
          </QueryProvider>
          <div suppressHydrationWarning>
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
