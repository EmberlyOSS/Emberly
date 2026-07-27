import pkg from '@/package.json'

import { apiResponse } from '@/packages/lib/api/response'
import { getRedisClient } from '@/packages/lib/cache/redis'
import { getConfig } from '@/packages/lib/config'
import {
  isCloudEnabled,
  isCloudConfigMismatched,
} from '@/packages/lib/config/env'
import { prisma } from '@/packages/lib/database/prisma'
import { eventQueue } from '@/packages/lib/events/bullmq/queue'
import { isWorkerRunning } from '@/packages/lib/events/init'
import { loggers } from '@/packages/lib/logger'
import { getStorageProvider } from '@/packages/lib/storage'
import { isStripeConfigured } from '@/packages/lib/stripe/client'

const logger = loggers.api
const startedAt = Date.now()

// The storage check performs a real write+delete against production storage
// (a live S3 API call, or a real disk write) — cache it briefly so frequent
// polling (uptime monitors, Docker HEALTHCHECK) doesn't churn storage on
// every single request.
const STORAGE_CHECK_CACHE_MS = 30_000
let cachedStorageCheck: { ok: boolean; latencyMs: number; at: number } | null =
  null

async function timed<T>(
  fn: () => Promise<T>
): Promise<{ ok: boolean; latencyMs: number; value?: T }> {
  const start = Date.now()
  try {
    const value = await fn()
    return { ok: true, latencyMs: Date.now() - start, value }
  } catch (error) {
    logger.warn('Health check probe failed', {
      error: (error as Error).message,
    })
    return { ok: false, latencyMs: Date.now() - start }
  }
}

async function checkStorageRoundTrip(): Promise<{
  ok: boolean
  latencyMs: number
  at: number
}> {
  if (
    cachedStorageCheck &&
    Date.now() - cachedStorageCheck.at < STORAGE_CHECK_CACHE_MS
  ) {
    return cachedStorageCheck
  }

  const result = await timed(async () => {
    const provider = await getStorageProvider()
    const testPath = `uploads/.health-check-${Date.now()}-${process.pid}.tmp`
    await provider.uploadFile(
      Buffer.from('emberly-health-check'),
      testPath,
      'text/plain'
    )
    await provider.deleteFile(testPath)
  })

  cachedStorageCheck = {
    ok: result.ok,
    latencyMs: result.latencyMs,
    at: Date.now(),
  }
  return cachedStorageCheck
}

export async function GET() {
  const cloud = isCloudEnabled()
  const workerRunning = isWorkerRunning()

  const [
    dbCheck,
    redisCheck,
    storageCheck,
    queueCheck,
    stripeConfigured,
    config,
  ] = await Promise.all([
    timed(() => prisma.$queryRaw`SELECT 1`),
    timed(async () => {
      const client = await getRedisClient()
      await client.ping()
    }),
    // Real round-trip (write + delete through the exact provider/path
    // uploads use), cached briefly — see checkStorageRoundTrip above.
    checkStorageRoundTrip(),
    timed(() =>
      eventQueue.getJobCounts('waiting', 'active', 'failed', 'delayed')
    ),
    cloud ? isStripeConfigured() : Promise.resolve(null),
    getConfig(),
  ])

  const checks: Record<string, unknown> = {
    database: {
      status: dbCheck.ok ? 'up' : 'down',
      latencyMs: dbCheck.latencyMs,
    },
    redis: {
      status: redisCheck.ok ? 'up' : 'down',
      latencyMs: redisCheck.latencyMs,
    },
    storage: {
      status: storageCheck.ok ? 'up' : 'down',
      provider: config.settings.general.storage.provider,
      latencyMs: storageCheck.latencyMs,
      checkedAt: new Date(storageCheck.at).toISOString(),
    },
    virusScanning: {
      status: process.env.VIRUSTOTAL_API_KEY ? 'configured' : 'not_configured',
    },
    eventQueue: {
      status: !workerRunning ? 'disabled' : queueCheck.ok ? 'up' : 'down',
      workerRunning,
      latencyMs: queueCheck.latencyMs,
      ...(queueCheck.value ?? {}),
    },
  }

  if (cloud) {
    checks.stripe = {
      status: stripeConfigured ? 'configured' : 'not_configured',
    }
  }

  const cloudConfigMismatched = isCloudConfigMismatched()

  const warnings: string[] = []
  if (cloudConfigMismatched) {
    warnings.push(
      'EMBERLY_RUN_CLOUD and NEXT_PUBLIC_EMBERLY_RUN_CLOUD are set to different values — server-side routing and client-rendered nav/UI will disagree about cloud mode. Set both to the same value and restart.'
    )
  }

  const isDown = !dbCheck.ok
  const isDegraded =
    !redisCheck.ok ||
    !storageCheck.ok ||
    (workerRunning && !queueCheck.ok) ||
    cloudConfigMismatched

  const status = isDown ? 'down' : isDegraded ? 'degraded' : 'ok'

  if (status !== 'ok') {
    logger.warn('Health check reported non-ok status', {
      status,
      checks,
      warnings,
    })
  }

  return apiResponse(
    {
      status,
      version: pkg.version,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      cloud,
      warnings,
      checks,
    },
    status === 'down' ? 503 : 200
  )
}
