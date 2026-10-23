import { createHash, randomBytes, randomInt } from 'crypto'

import { createUserApiKey } from '@/packages/lib/api-keys'
import { prisma } from '@/packages/lib/database/prisma'

export const DEVICE_CODE_TTL_SECONDS = 600
export const POLL_INTERVAL_SECONDS = 5

export const DEVICE_CLIENTS: Record<string, string> = {
  flicker: 'Flicker',
}

// No 0/O/1/I so codes are easy to read aloud and type
const USER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')

export function normalizeUserCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function formatUserCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

export async function createDeviceAuthorization(
  clientId: string,
  deviceName: string
) {
  const deviceCode = randomBytes(32).toString('base64url')
  const userCode = Array.from(
    { length: 8 },
    () => USER_CODE_ALPHABET[randomInt(USER_CODE_ALPHABET.length)]
  ).join('')

  await prisma.deviceAuthorization.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  await prisma.deviceAuthorization.create({
    data: {
      deviceCodeHash: hash(deviceCode),
      userCode,
      clientId,
      deviceName,
      expiresAt: new Date(Date.now() + DEVICE_CODE_TTL_SECONDS * 1000),
    },
  })

  return { deviceCode, userCode: formatUserCode(userCode) }
}

export async function findPendingByUserCode(userCode: string) {
  const request = await prisma.deviceAuthorization.findUnique({
    where: { userCode: normalizeUserCode(userCode) },
  })
  if (
    !request ||
    request.status !== 'pending' ||
    request.expiresAt < new Date()
  )
    return null
  return request
}

export async function decideDeviceAuthorization(
  userCode: string,
  userId: string,
  approve: boolean
) {
  const request = await findPendingByUserCode(userCode)
  if (!request) return null
  return prisma.deviceAuthorization.update({
    where: { id: request.id },
    data: approve
      ? { status: 'approved', userId, approvedAt: new Date() }
      : { status: 'denied', userId },
  })
}

export type ExchangeResult =
  | { status: 'pending' | 'denied' | 'expired' | 'invalid' }
  | {
      status: 'approved'
      key: string
      user: {
        id: string
        name: string | null
        email: string
        image: string | null
        urlId: string
      }
    }

export async function exchangeDeviceCode(
  deviceCode: string
): Promise<ExchangeResult> {
  const request = await prisma.deviceAuthorization.findUnique({
    where: { deviceCodeHash: hash(deviceCode) },
  })
  if (!request) return { status: 'invalid' }
  if (request.expiresAt < new Date() && request.status !== 'approved')
    return { status: 'expired' }
  if (request.status === 'pending') return { status: 'pending' }
  if (request.status === 'denied' || !request.userId)
    return { status: 'denied' }
  if (request.status !== 'approved') return { status: 'invalid' }

  const claimed = await prisma.deviceAuthorization.updateMany({
    where: { id: request.id, status: 'approved' },
    data: { status: 'consumed' },
  })
  if (claimed.count === 0) return { status: 'invalid' }

  const keyName =
    `${DEVICE_CLIENTS[request.clientId] ?? request.clientId} on ${request.deviceName}`.slice(
      0,
      64
    )
  await prisma.userApiKey.deleteMany({
    where: { userId: request.userId, name: keyName },
  })
  const { key } = await createUserApiKey(request.userId, keyName)

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: request.userId },
    select: { id: true, name: true, email: true, image: true, urlId: true },
  })
  return { status: 'approved', key, user }
}
