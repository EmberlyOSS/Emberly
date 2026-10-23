import { join } from 'path'

import { serveStoredImage } from '@/lib/storage/public-media'

// GET /api/favicon: streams the custom favicon from storage
export async function GET() {
  return serveStoredImage(join('uploads', 'favicon.png'), 'favicon.png')
}
