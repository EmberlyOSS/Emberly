import { statfs } from 'node:fs/promises'
import os from 'node:os'

import pkg from '@/package.json'

import { apiResponse } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/api-auth'
import { getConfig, getIntegrations } from '@/lib/config'
import { isCloudEnabled } from '@/lib/config/env'
import { prisma } from '@emberly/db'
import { resolveEmailProvider } from '@/lib/emails'
import { getLicense } from '@/lib/license'
import { dataRoot } from '@/lib/storage/paths'

export const dynamic = 'force-dynamic'

/**
 * Details for the admin health panel and bug reports. Reports only whether
 * things are set up, never keys, tokens or webhook URLs.
 */
export async function GET(req: Request) {
  const { response } = await requireAdmin(req)
  if (response) return response

  const [config, integrations] = await Promise.all([
    getConfig(),
    getIntegrations(),
  ])
  const i = integrations as Record<string, any>

  const email = await resolveEmailProvider()

  const storageProvider = config.settings.general.storage.provider
  let disk: { freeBytes: number; totalBytes: number } | null = null
  if (storageProvider === 'local') {
    try {
      const stats = await statfs(dataRoot())
      disk = {
        freeBytes: stats.bavail * stats.bsize,
        totalBytes: stats.blocks * stats.bsize,
      }
    } catch {
      disk = null
    }
  }

  const [dbVersion, migration] = await Promise.all([
    prisma.$queryRaw<Array<{ server_version: string }>>`SHOW server_version`
      .then((rows) => rows[0]?.server_version ?? null)
      .catch(() => null),
    prisma.$queryRaw<
      Array<{ migration_name: string; finished_at: Date | null }>
    >`
        SELECT migration_name, finished_at FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 1`
      .then((rows) => rows[0]?.migration_name ?? null)
      .catch(() => null),
  ])

  const license = getLicense()
  const memory = process.memoryUsage()

  return apiResponse({
    version: pkg.version,
    runtime: {
      bun: process.versions.bun ?? null,
      node: process.versions.node,
      platform: `${os.platform()} ${os.release()} (${os.arch()})`,
      environment: process.env.NODE_ENV ?? 'development',
      cloud: isCloudEnabled(),
      processUptimeSeconds: Math.floor(process.uptime()),
      memoryMb: Math.round(memory.rss / 1024 / 1024),
      inProcessWorker: process.env.EMBERLY_RUN_EVENT_WORKER !== 'false',
    },
    database: { version: dbVersion, latestMigration: migration },
    storage: { provider: storageProvider, disk },
    email,
    discordAlerts: {
      configured: Boolean(
        i.discord?.webhookUrl || process.env.DISCORD_WEBHOOK_URL
      ),
    },
    license:
      'license' in license
        ? {
            state: license.state,
            licensee: license.license.licensee,
            features: license.license.features,
            expiresAt: license.license.expiresAt ?? null,
          }
        : { state: license.state },
  })
}
