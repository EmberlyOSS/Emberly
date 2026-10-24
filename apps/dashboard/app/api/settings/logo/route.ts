import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { updateConfigSection } from '@/lib/config'
import { getFeatures } from '@/lib/features'
import { loggers } from '@/lib/logger'
import { getStorageProvider } from '@/lib/storage'

const logger = loggers.files
const MAX_BYTES = 1024 * 1024
const LOGO_TYPES = ['png', 'jpg', 'webp'] as const
type LogoType = (typeof LOGO_TYPES)[number]

function detectType(buffer: Buffer): LogoType | null {
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'jpg'
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'webp'
  return null
}

async function saveLogo(logo: string | null) {
  await updateConfigSection('appearance', { logo })
}

async function authorize() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  if (!(await getFeatures()).whiteLabel) {
    return new NextResponse(
      'A white-label license is required to use a custom logo',
      { status: 403 }
    )
  }
  return null
}

export async function POST(req: Request) {
  const denied = await authorize()
  if (denied) return denied

  try {
    const file = (await req.formData()).get('file')
    if (!(file instanceof File)) {
      return new NextResponse('No file provided', { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return new NextResponse('Logos can be up to 1 MB', { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const type = detectType(buffer)
    if (!type) {
      return new NextResponse('Upload a PNG, JPEG or WebP image', {
        status: 415,
      })
    }

    const storage = await getStorageProvider()
    for (const ext of LOGO_TYPES) {
      if (ext !== type)
        await storage.deleteFile(`uploads/branding/logo.${ext}`).catch(() => {})
    }
    await storage.uploadFile(
      buffer,
      `uploads/branding/logo.${type}`,
      `image/${type === 'jpg' ? 'jpeg' : type}`
    )

    const url = `/api/logo/${type}?v=${Date.now()}`
    await saveLogo(url)
    return NextResponse.json({ data: { url } })
  } catch (error) {
    logger.error('Error updating logo', error as Error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE() {
  const denied = await authorize()
  if (denied) return denied

  const storage = await getStorageProvider()
  for (const ext of LOGO_TYPES) {
    await storage.deleteFile(`uploads/branding/logo.${ext}`).catch(() => {})
  }
  await saveLogo(null)
  return NextResponse.json({ data: { url: null } })
}
