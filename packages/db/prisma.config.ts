import { config } from 'dotenv'
import { resolve } from 'node:path'
import { defineConfig } from 'prisma/config'

config({ path: resolve(import.meta.dirname, '../../.env'), quiet: true })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
  migrations: {
    path: 'prisma/migrations',
  },
})
