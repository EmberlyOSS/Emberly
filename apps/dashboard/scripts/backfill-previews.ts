import { prisma } from '@emberly/db'

import { ensurePreview } from '../lib/embeds/preview'

const BATCH = 100

async function main() {
  let cursor: string | undefined
  let done = 0
  let made = 0

  for (;;) {
    const files = await prisma.file.findMany({
      where: { mimeType: { startsWith: 'image/' }, width: null },
      select: {
        id: true,
        path: true,
        mimeType: true,
        size: true,
        storageBucketId: true,
        width: true,
        height: true,
      },
      orderBy: { id: 'asc' },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (files.length === 0) break

    const results = await Promise.all(files.map((file) => ensurePreview(file)))
    made += results.filter(Boolean).length
    done += files.length
    cursor = files[files.length - 1].id
    console.log(`${done} images checked, ${made} previews made`)
  }

  console.log('Done')
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
