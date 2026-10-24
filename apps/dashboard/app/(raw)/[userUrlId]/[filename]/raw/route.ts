import { NextResponse } from 'next/server'

import { findFileByUrlPath } from '@/lib/files/lookup'
import {
  CORS_HEADERS,
  denyFileAccess,
  emptyResponse,
  serveStoredFile,
} from '@/lib/files/serve'

type Params = { params: Promise<{ userUrlId: string; filename: string }> }

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

async function handle(req: Request, { params }: Params, head: boolean) {
  try {
    const { userUrlId, filename } = await params
    const file = await findFileByUrlPath(userUrlId, filename)
    if (!file) return emptyResponse(404)

    const deny = await denyFileAccess(req, file)
    if (deny) return deny

    return await serveStoredFile(req, file, { head })
  } catch (error) {
    if (error instanceof Error && error.message.includes('NoSuchKey')) {
      return emptyResponse(404)
    }
    console.error('File serve error:', error)
    return emptyResponse(500)
  }
}

export function HEAD(req: Request, ctx: Params) {
  return handle(req, ctx, true)
}

export function GET(req: Request, ctx: Params) {
  return handle(req, ctx, false)
}
