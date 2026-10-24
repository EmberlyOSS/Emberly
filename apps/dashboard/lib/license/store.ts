import { prisma, type Prisma } from '@emberly/db'

import { setStoredLicenseKey } from './index'

const KEY_ROW = 'license_key'
const CHECK_IN_ROW = 'license_check_in'

/** Loads the key entered in the admin panel into memory. */
export async function loadStoredLicenseKey() {
  const row = await prisma.config.findUnique({ where: { key: KEY_ROW } })
  setStoredLicenseKey(typeof row?.value === 'string' ? row.value : null)
}

/**
 * Saves or removes the key entered in the admin panel. Check-in state belongs
 * to the previous key, so it's cleared and can't bring an old key back.
 */
export async function saveLicenseKey(key: string | null) {
  await prisma.$transaction([
    key
      ? prisma.config.upsert({
          where: { key: KEY_ROW },
          create: { key: KEY_ROW, value: key as Prisma.InputJsonValue },
          update: { value: key as Prisma.InputJsonValue },
        })
      : prisma.config.deleteMany({ where: { key: KEY_ROW } }),
    prisma.config.deleteMany({ where: { key: CHECK_IN_ROW } }),
  ])
  setStoredLicenseKey(key)
}
