import { NextRequest } from 'next/server'

import { getCORSHeaders, handleCORSPreflight } from '@/lib/api/cors'
import {
  isSafeMediaFilename,
  mediaStoragePath,
  serveStoredImage,
} from '@/lib/storage/public-media'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const preflightResponse = handleCORSPreflight(request)
  if (preflightResponse) return preflightResponse
  return new Response(null, { status: 204 })
}

// GET /api/avatars/:filename: streams the avatar from storage (never redirects
// to the storage endpoint, which is private)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  if (!isSafeMediaFilename(filename)) return new Response(null, { status: 404 })
  return serveStoredImage(
    mediaStoragePath('avatars', filename),
    filename,
    getCORSHeaders()
  )
}
