import { createHash, randomBytes } from 'crypto'

import { prisma } from '@emberly/db'

const KEY_PREFIX = 'ebk_'
const MAX_API_KEYS = 10

function generateApiKey(): { full: string; hash: string; prefix: string } {
  const raw = randomBytes(24).toString('base64url')
  const full = `${KEY_PREFIX}${raw}`
  const hash = createHash('sha256').update(full).digest('hex')
  const prefix = full.slice(0, 12)
  return { full, hash, prefix }
}

export async function listUserApiKeys(userId: string) {
  return prisma.userApiKey.findMany({
    where: { userId },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
}

/** Create a new API key. Returns the full key — it will NOT be retrievable again. */
export async function createUserApiKey(userId: string, name: string) {
  const count = await prisma.userApiKey.count({ where: { userId } })
  if (count >= MAX_API_KEYS) {
    throw new Error(`Maximum of ${MAX_API_KEYS} API keys reached`)
  }

  const { full, hash, prefix } = generateApiKey()
  await prisma.userApiKey.create({
    data: { userId, name, keyHash: hash, prefix },
  })
  return { key: full, prefix, name }
}

/** Revoke an API key by id */
export async function revokeUserApiKey(userId: string, keyId: string) {
  const result = await prisma.userApiKey.deleteMany({
    where: { id: keyId, userId },
  })
  if (result.count === 0) throw new Error('API key not found')
}
