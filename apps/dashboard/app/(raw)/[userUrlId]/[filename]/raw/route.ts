import { NextResponse } from 'next/server'

import { findFileByUrlPath } from '@/lib/files/lookup'
import {
  CORS_HEADERS,
  denyFileAccess,
  emptyResponse,
  serveStoredFile,
} from '@/lib/files/serve'
import { loggers } from '@/lib/logger'
import { describeStorageError, isStorageNotFound } from '@/lib/storage/errors'

const logger = loggers.files

type Params = { params: Promise<{ userUrlId: string; filename: string }> }

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

async function handle(req: Request, { params }: Params, head: boolean) {
  let logContext: Record<string, unknown> = {}
  try {
    const { userUrlId, filename } = await params
    const file = await findFileByUrlPath(userUrlId, filename)
    if (!file) return emptyResponse(404)

    const deny = await denyFileAccess(req, file)
    if (deny) return deny

    logContext = {
      urlPath: `/${userUrlId}/${filename}`,
      storagePath: file.path,
      storageBucketId: file.storageBucketId,
    }
    return await serveStoredFile(req, file, { head })
  } catch (error) {
    if (isStorageNotFound(error)) {
      logger.warn('Stored file is missing', logContext)
      return emptyResponse(404)
    }
    logger.error('File serve error', error, {
      ...logContext,
      storage: describeStorageError(error),
    })
    return emptyResponse(502)
  }
}

export function HEAD(req: Request, ctx: Params) {
  return handle(req, ctx, true)
}

export function GET(req: Request, ctx: Params) {
  return handle(req, ctx, false)
}
