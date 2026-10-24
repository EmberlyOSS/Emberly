import { NextResponse } from 'next/server'

import { readPreview } from '@/lib/embeds/preview'
import { PREVIEW_TYPE } from '@/lib/embeds/preview-rules'
import { fileCacheControl } from '@/lib/files/access'
import { findFileByUrlPath } from '@/lib/files/lookup'
import {
  CORS_HEADERS,
  denyFileAccess,
  emptyResponse,
  serveStoredFile,
} from '@/lib/files/serve'

type Params = { params: Promise<{ userUrlId: string; filename: string }> }

async function handle(req: Request, { params }: Params, head: boolean) {
  try {
    const { userUrlId, filename } = await params
    const file = await findFileByUrlPath(userUrlId, filename)
    if (!file || !file.mimeType.startsWith('image/')) return emptyResponse(404)

    const deny = await denyFileAccess(req, file)
    if (deny) return deny

    const preview = await readPreview(file)
    if (!preview) return await serveStoredFile(req, file, { head })

    return new NextResponse(head ? null : new Uint8Array(preview), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': PREVIEW_TYPE,
        'Content-Length': preview.length.toString(),
        'Cache-Control': fileCacheControl(file),
      },
    })
  } catch (error) {
    console.error('Preview serve error:', error)
    return emptyResponse(500)
  }
}

export function HEAD(req: Request, ctx: Params) {
  return handle(req, ctx, true)
}

export function GET(req: Request, ctx: Params) {
  return handle(req, ctx, false)
}
