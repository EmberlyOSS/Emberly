import { Readable } from 'node:stream'

import { HTTP_STATUS, apiError } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'
import { prisma } from '@emberly/db'
import { getStorageProvider } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params
  const record = await prisma.dataExport.findUnique({ where: { id } })

  if (!record || record.userId !== user.id) {
    return apiError('Export not found', HTTP_STATUS.NOT_FOUND)
  }
  if (record.status !== 'ready' || !record.path) {
    return apiError("This export isn't ready yet", HTTP_STATUS.CONFLICT)
  }
  if (record.expiresAt && record.expiresAt < new Date()) {
    return apiError(
      'This download link has expired. Request a new export from Profile → Data.',
      HTTP_STATUS.GONE
    )
  }

  const storage = await getStorageProvider()
  const stream = await storage.getFileStream(record.path)
  const day = (record.completedAt ?? record.createdAt)
    .toISOString()
    .slice(0, 10)

  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="data-export-${day}.zip"`,
      ...(record.size ? { 'Content-Length': String(record.size) } : {}),
      'Cache-Control': 'private, no-store',
    },
  })
}
