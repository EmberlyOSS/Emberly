import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: process.env.BUILD_STANDALONE ? 'standalone' : undefined,
  async redirects() {
    return [
      { source: '/docs', destination: '/getting-started', permanent: true },
      { source: '/docs/:path*', destination: '/:path*', permanent: true },
    ]
  },
}

export default withMDX(config)
