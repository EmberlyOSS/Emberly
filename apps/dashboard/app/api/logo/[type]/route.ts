import { serveStoredImage } from '@/lib/storage/public-media'

const TYPES = new Set(['png', 'jpg', 'webp'])

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params
  if (!TYPES.has(type)) return new Response(null, { status: 404 })
  return serveStoredImage(`uploads/branding/logo.${type}`, `logo.${type}`, {
    'Content-Security-Policy': "default-src 'none'",
  })
}
