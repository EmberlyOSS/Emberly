import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/packages/lib/database/prisma'

/**
 * Internal API endpoint to fetch file settings for middleware use.
 * This is needed because middleware runs on Edge runtime and can't use Prisma directly.
 */
export async function GET(request: NextRequest) {
  const urlPath = request.nextUrl.searchParams.get('urlPath')
  if (!urlPath) {
    return NextResponse.json(
      { error: 'Missing urlPath parameter' },
      { status: 400 }
    )
  }

  try {
    const file = await prisma.file.findUnique({
      where: { urlPath },
      select: {
        user: {
          select: { enableRichEmbeds: true },
        },
      },
    })

    if (!file?.user) {
      return NextResponse.json({ enableRichEmbeds: true })
    }

    return NextResponse.json({
      enableRichEmbeds: file.user.enableRichEmbeds !== false,
    })
  } catch (error) {
    console.error('Error fetching file settings:', error)
    return NextResponse.json({ enableRichEmbeds: true })
  }
}
