import { prisma } from '@emberly/db'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Readable } from 'node:stream'
import sharp from 'sharp'

import { loggers } from '@/lib/logger'
import { getProviderForStoredFile } from '@/lib/storage'
import { dataPath } from '@/lib/storage/paths'

import { PREVIEW_MAX_EDGE, baseMime, isPreviewable } from './preview-rules'

const logger = loggers.files.getChildLogger('preview')

const MAX_SOURCE_MB = 50
const MAX_CONCURRENT = 2

export interface PreviewSource {
  id: string
  path: string
  mimeType: string
  size: number
  storageBucketId: string | null
  width?: number | null
  height?: number | null
}

const previewFile = (fileId: string) =>
  dataPath('cache', 'previews', `${fileId}.webp`)

const pending = new Map<string, Promise<boolean>>()
const waiting: Array<() => void> = []
let running = 0

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve))
  }
  running++
  try {
    return await task()
  } finally {
    running--
    waiting.shift()?.()
  }
}

async function readAll(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

async function generate(file: PreviewSource): Promise<boolean> {
  if (!baseMime(file.mimeType).startsWith('image/')) return false
  if (file.size > MAX_SOURCE_MB) return false

  const storage = await getProviderForStoredFile(file.storageBucketId)
  const source = await readAll(await storage.getFileStream(file.path))

  const image = sharp(source, { failOn: 'none' })
  const meta = await image.metadata()
  const width = meta.autoOrient?.width ?? meta.width
  const height = meta.autoOrient?.height ?? meta.height

  if (width && height && (file.width !== width || file.height !== height)) {
    await prisma.file.update({
      where: { id: file.id },
      data: { width, height },
    })
  }

  const animated = (meta.pages ?? 1) > 1
  if (!isPreviewable(file.mimeType) || animated) return false

  const output = await image
    .rotate()
    .resize({
      width: PREVIEW_MAX_EDGE,
      height: PREVIEW_MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer()

  const target = previewFile(file.id)
  await mkdir(dirname(target), { recursive: true })
  const temp = `${target}.${process.pid}.tmp`
  await writeFile(temp, output)
  await rename(temp, target)
  return true
}

/**
 * Makes the file's preview and records its dimensions, once. Returns whether
 * a preview exists afterwards. Concurrent calls for the same file share work.
 */
export function ensurePreview(file: PreviewSource): Promise<boolean> {
  const existing = pending.get(file.id)
  if (existing) return existing

  const job = withSlot(() => generate(file))
    .catch((error) => {
      logger.warn('Could not create preview', {
        fileId: file.id,
        error: error instanceof Error ? error.message : String(error),
      })
      return false
    })
    .finally(() => pending.delete(file.id))

  pending.set(file.id, job)
  return job
}

/** Starts making the preview in the background, e.g. right after an upload. */
export function queuePreview(file: PreviewSource) {
  if (!baseMime(file.mimeType).startsWith('image/')) return
  void ensurePreview(file)
}

/** Returns the preview image, making it first if needed. */
export async function readPreview(file: PreviewSource): Promise<Buffer | null> {
  try {
    return await readFile(previewFile(file.id))
  } catch {}
  if (!(await ensurePreview(file))) return null
  try {
    return await readFile(previewFile(file.id))
  } catch {
    return null
  }
}

export async function removePreview(fileId: string) {
  await rm(previewFile(fileId), { force: true }).catch(() => {})
}
