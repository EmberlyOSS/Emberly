import { createMDX } from 'fumadocs-mdx/next'
import { fileURLToPath } from 'node:url'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: process.env.BUILD_STANDALONE ? 'standalone' : undefined,
  outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)),
}

export default withMDX(config)
