import archiver from 'archiver'
import { once } from 'node:events'

import { prisma } from '@emberly/db'

import { appUrl } from '@/lib/config/env'
import { loggers } from '@/lib/logger'
import {
  S3StorageProvider,
  getProviderForStoredFile,
  getStorageProvider,
} from '@/lib/storage'

const logger = loggers.users.getChildLogger('data-export')

export const EXPORT_TTL_DAYS = 7
export const EXPORT_COOLDOWN_MS = 60 * 60 * 1000

const exportPath = (exportId: string) => `uploads/.exports/${exportId}.zip`

export const exportDownloadUrl = (exportId: string) =>
  `${appUrl().replace(/\/+$/, '')}/api/profile/export/${exportId}`

function safeName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/^\.+/, '_') || 'file'
}

/** Removes a user's earlier exports, files included. */
export async function removeExports(userId: string, keepId?: string) {
  const old = await prisma.dataExport.findMany({
    where: { userId, ...(keepId ? { id: { not: keepId } } : {}) },
    select: { id: true, path: true },
  })
  if (!old.length) return
  const storage = await getStorageProvider()
  await Promise.all(
    old.map((e) =>
      e.path ? storage.deleteFile(e.path).catch(() => {}) : undefined
    )
  )
  await prisma.dataExport.deleteMany({
    where: { id: { in: old.map((e) => e.id) } },
  })
}

async function accountData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      fullName: true,
      email: true,
      emailVerified: true,
      image: true,
      bio: true,
      website: true,
      twitter: true,
      github: true,
      discord: true,
      isProfilePublic: true,
      showLinkedAccounts: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      storageUsed: true,
      storageQuotaMB: true,
      theme: true,
      randomizeFileUrls: true,
      enableRichEmbeds: true,
      preferredUploadDomain: true,
      defaultFileExpiration: true,
      defaultFileExpirationAction: true,
      twoFactorEnabled: true,
      emailNotificationsEnabled: true,
      emailPreferences: true,
      discordNotificationsEnabled: true,
      discordPreferences: true,
      shortenedUrls: {
        select: {
          shortCode: true,
          targetUrl: true,
          domain: true,
          clicks: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      customDomains: {
        select: {
          domain: true,
          verified: true,
          isPrimary: true,
          createdAt: true,
        },
      },
      devices: {
        select: {
          name: true,
          lastLocation: true,
          firstSeenAt: true,
          lastSeenAt: true,
        },
      },
    },
  })
  return user
}

/**
 * Builds the ZIP for an export and stores it, then marks the export ready.
 * Runs in the background from the event worker.
 */
export async function buildUserExport(exportId: string) {
  const record = await prisma.dataExport.findUnique({ where: { id: exportId } })
  if (!record || record.status === 'ready') return null

  const account = await accountData(record.userId)
  if (!account) {
    await prisma.dataExport.delete({ where: { id: exportId } }).catch(() => {})
    return null
  }

  const files = await prisma.file.findMany({
    where: { userId: record.userId },
    select: {
      name: true,
      path: true,
      mimeType: true,
      size: true,
      visibility: true,
      isPaste: true,
      uploadedAt: true,
      ocrText: true,
      storageBucketId: true,
    },
    orderBy: { uploadedAt: 'asc' },
  })

  const storage = await getStorageProvider()
  const path = exportPath(exportId)
  const out = await storage.createWriteStream(path, 'application/zip')
  const done =
    storage instanceof S3StorageProvider
      ? once(out, 's3Complete')
      : once(out, 'close')

  const archive = archiver('zip', { zlib: { level: 6 } })
  let bytes = 0
  archive.on('data', (chunk: Buffer) => {
    bytes += chunk.length
  })
  archive.on('warning', (err) =>
    logger.warn('Export archive warning', { exportId, error: err.message })
  )
  archive.pipe(out)

  const { shortenedUrls, customDomains, devices, ...profile } = account
  const skipped: string[] = []
  const used = new Set<string>()
  const fileIndex = []

  for (const file of files) {
    const day = file.uploadedAt.toISOString().slice(0, 10)
    let entry = `files/${day}/${safeName(file.name)}`
    for (let n = 2; used.has(entry); n++) {
      entry = `files/${day}/${n}-${safeName(file.name)}`
    }
    used.add(entry)

    try {
      const provider = await getProviderForStoredFile(file.storageBucketId)
      const stream = await provider.getFileStream(file.path)
      archive.append(stream, { name: entry, date: file.uploadedAt })
      await once(archive, 'entry')
      fileIndex.push({
        name: file.name,
        path: entry,
        type: file.mimeType,
        size: file.size,
        visibility: file.visibility,
        paste: file.isPaste,
        uploadedAt: file.uploadedAt,
        ...(file.ocrText ? { ocrText: file.ocrText } : {}),
      })
    } catch (error) {
      skipped.push(file.name)
      logger.warn('Skipped a file in an export', {
        exportId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  archive.append(
    JSON.stringify(
      {
        exportedAt: new Date(),
        account: profile,
        files: fileIndex,
        links: shortenedUrls,
        domains: customDomains,
        devices,
        ...(skipped.length ? { filesNotIncluded: skipped } : {}),
      },
      (_, value) => (typeof value === 'bigint' ? Number(value) : value),
      2
    ),
    { name: 'account.json' }
  )

  await archive.finalize()
  await done

  const expiresAt = new Date(Date.now() + EXPORT_TTL_DAYS * 86_400_000)
  return prisma.dataExport.update({
    where: { id: exportId },
    data: {
      status: 'ready',
      path,
      size: BigInt(bytes),
      completedAt: new Date(),
      expiresAt,
    },
  })
}

export async function failUserExport(exportId: string, error: unknown) {
  await prisma.dataExport
    .update({
      where: { id: exportId },
      data: {
        status: 'failed',
        error: (error instanceof Error ? error.message : String(error)).slice(
          0,
          500
        ),
      },
    })
    .catch(() => {})
}
