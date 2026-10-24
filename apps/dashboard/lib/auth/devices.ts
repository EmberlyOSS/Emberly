import { prisma } from '@emberly/db'
import { cookies } from 'next/headers'

import { describeDevice } from '@/lib/utils/user-agent'

import { sessionCookieDomain } from './session-cookie'
import { appUrl } from '@/lib/config/env'

export const DEVICE_COOKIE = 'emberly_device'
const ONE_YEAR = 60 * 60 * 24 * 365
const ACTIVE_CACHE_MS = 30_000

interface SeenFrom {
  userAgent?: string
  ip?: string
  location?: string | null
}

export async function resolveDevice(userId: string, seen: SeenFrom) {
  const jar = await cookies()
  const cookieId = jar.get(DEVICE_COOKIE)?.value
  const name = describeDevice(seen.userAgent) ?? 'Unknown device'
  const details = {
    userAgent: seen.userAgent ?? null,
    lastIp: seen.ip ?? null,
    lastLocation: seen.location ?? null,
    lastSeenAt: new Date(),
  }

  const known = cookieId
    ? await prisma.userDevice.findFirst({
        where: { id: cookieId, userId, revokedAt: null },
        select: { id: true },
      })
    : null

  if (known) {
    await prisma.userDevice.update({ where: { id: known.id }, data: details })
    return { id: known.id, isNew: false, isFirst: false }
  }

  const [device, others] = await Promise.all([
    prisma.userDevice.create({ data: { userId, name, ...details } }),
    prisma.userDevice.count({ where: { userId } }),
  ])

  jar.set(DEVICE_COOKIE, device.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: appUrl().startsWith('https://'),
    path: '/',
    maxAge: ONE_YEAR,
    domain: sessionCookieDomain(),
  })

  return { id: device.id, isNew: true, isFirst: others === 0 }
}

const activeCache = new Map<string, { active: boolean; expires: number }>()

export async function isDeviceActive(deviceId: string) {
  const cached = activeCache.get(deviceId)
  if (cached && cached.expires > Date.now()) return cached.active

  const device = await prisma.userDevice.findUnique({
    where: { id: deviceId },
    select: { revokedAt: true },
  })
  const active = !!device && !device.revokedAt
  if (activeCache.size > 10_000) activeCache.clear()
  activeCache.set(deviceId, { active, expires: Date.now() + ACTIVE_CACHE_MS })
  return active
}

export async function listDevices(userId: string) {
  return prisma.userDevice.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: 'desc' },
    select: {
      id: true,
      name: true,
      userAgent: true,
      lastLocation: true,
      lastIp: true,
      firstSeenAt: true,
      lastSeenAt: true,
    },
  })
}

export async function revokeDevice(userId: string, deviceId: string) {
  const { count } = await prisma.userDevice.updateMany({
    where: { id: deviceId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  activeCache.delete(deviceId)
  return count > 0
}

export async function renameDevice(
  userId: string,
  deviceId: string,
  name: string
) {
  const { count } = await prisma.userDevice.updateMany({
    where: { id: deviceId, userId, revokedAt: null },
    data: { name: name.trim().slice(0, 64) },
  })
  return count > 0
}
