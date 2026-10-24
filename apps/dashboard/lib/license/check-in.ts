import { randomUUID } from 'node:crypto'

import { prisma, type Prisma } from '@emberly/db'

import { appUrl } from '@/lib/config/app-url'
import { loggers } from '@/lib/logger'
import pkg from '@/package.json'

import {
  currentLicenseKey,
  parseLicense,
  setRefreshedLicenseKey,
  setRevokedLicenseIds,
} from './index'

const logger = loggers.licenses
const STATE_KEY = 'license_check_in'
const INSTANCE_KEY = 'instance_id'
const INTERVAL_MS = 24 * 60 * 60 * 1000

export interface CheckInState {
  checkedAt?: string
  failedAt?: string
  status?: 'active' | 'cancelled' | 'revoked' | 'expired' | 'unknown'
  key?: string
  activations?: number
  maxActivations?: number
  overLimit?: boolean
  error?: string
}

const server = () =>
  (
    process.env.EMBERLY_LICENSE_SERVER?.trim() || 'https://licenses.embrly.ca'
  ).replace(/\/+$/, '')
export const checkInEnabled = () =>
  !!process.env.EMBERLY_LICENSE_KEY?.trim() &&
  process.env.EMBERLY_LICENSE_CHECKIN !== 'false'

async function read<T>(key: string): Promise<T | null> {
  return (
    ((await prisma.config.findUnique({ where: { key } }))?.value as
      T | undefined) ?? null
  )
}

async function write(key: string, value: unknown) {
  const json = value as Prisma.InputJsonValue
  await prisma.config.upsert({
    where: { key },
    create: { key, value: json },
    update: { value: json },
  })
}

async function instanceId() {
  const existing = await read<string>(INSTANCE_KEY)
  if (existing) return existing
  const id = randomUUID()
  await write(INSTANCE_KEY, id)
  return id
}

function applyRevocation(state: CheckInState) {
  const key = currentLicenseKey()
  const parsed = key ? parseLicense(key, { checkDomain: false }) : null
  setRevokedLicenseIds(
    state.status === 'revoked' && parsed && 'license' in parsed
      ? [parsed.license.id]
      : []
  )
}

export async function getCheckInState() {
  return read<CheckInState>(STATE_KEY)
}

export async function checkInNow(): Promise<CheckInState | null> {
  const key = currentLicenseKey()
  if (!key || !checkInEnabled()) return null
  const previous = (await getCheckInState()) ?? {}

  let state: CheckInState
  try {
    const res = await fetch(`${server()}/api/v1/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        instanceId: await instanceId(),
        domain: new URL(appUrl()).hostname,
        version: pkg.version,
      }),
      signal: AbortSignal.timeout(15_000),
    })
    const data = (await res.json().catch(() => ({}))) as CheckInState & {
      error?: string
    }
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

    const refreshed =
      data.key && setRefreshedLicenseKey(data.key) ? data.key : previous.key
    if (data.key && refreshed === data.key)
      logger.info('Received a renewed license key')
    state = {
      checkedAt: new Date().toISOString(),
      status: data.status,
      key: refreshed,
      activations: data.activations,
      maxActivations: data.maxActivations,
      overLimit: data.overLimit,
    }
  } catch (error) {
    logger.warn('License check-in failed, keeping the current key', {
      error: (error as Error).message,
    })
    state = {
      ...previous,
      failedAt: new Date().toISOString(),
      error: (error as Error).message,
    }
  }

  applyRevocation(state)
  await write(STATE_KEY, state)
  return state
}

export async function startLicenseCheckIns() {
  if (!checkInEnabled()) return
  const state = await getCheckInState().catch(() => null)
  if (state?.key) setRefreshedLicenseKey(state.key)
  if (state) applyRevocation(state)
  setTimeout(() => void checkInNow(), 60_000).unref()
  setInterval(() => void checkInNow(), INTERVAL_MS).unref()
}
