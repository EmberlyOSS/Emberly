import {
  isSafeMediaFilename,
  mediaStoragePath,
  serveStoredImage,
} from '@/packages/lib/storage/public-media'

// GET /api/banners/:filename: streams a profile banner from storage
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  if (!isSafeMediaFilename(filename)) return new Response(null, { status: 404 })
  return serveStoredImage(mediaStoragePath('banners', filename), filename)
}
