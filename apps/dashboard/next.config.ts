import { loadEnvConfig } from '@next/env'
import type { NextConfig } from 'next'
import { resolve } from 'node:path'

const root = resolve(__dirname, '../..')
loadEnvConfig(root)

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  outputFileTracingRoot: root,
  transpilePackages: ['@emberly/db'],
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ['tesseract.js'],
  outputFileTracingIncludes: {
    '/api/**/*': ['../../node_modules/**/*.wasm', '../../node_modules/**/*.proto'],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    proxyClientMaxBodySize: '2gb',
    serverActions: {
      bodySizeLimit: '2gb',
    },

    optimizePackageImports: [
      'devicons',
      'lucide-react',
      'react-icons',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'date-fns',
      'recharts',
    ],
  },
}

// withSentryConfig wraps webpack — it is incompatible with Turbopack and causes
// native panics in the turbo-tasks-backend module graph. Only apply it during
// production builds (next build), never in the dev server (next dev --turbopack).
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'

let exportedConfig: NextConfig = nextConfig

if (isBuild) {
  // Dynamic require avoids the import being processed by Turbopack at all
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withSentryConfig } = require('@sentry/nextjs')
  exportedConfig = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    sourcemaps: {
      disable: !process.env.SENTRY_AUTH_TOKEN,
    },
  }) as NextConfig
}

export default exportedConfig
