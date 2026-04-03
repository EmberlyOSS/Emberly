import { NextResponse } from 'next/server'

import { prisma } from '@/packages/lib/database/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params

    // 1. Try URL short code first
    const url = await prisma.shortenedUrl.findUnique({
      where: { shortCode },
    })

    if (url) {
      // Block flagged URLs
      if (url.flagged) {
        return new NextResponse(
          'This URL has been flagged by our moderation team and is currently unavailable.',
          { status: 451, headers: { 'Content-Type': 'text/plain' } }
        )
      }

      await prisma.shortenedUrl.update({
        where: { id: url.id },
        data: { clicks: { increment: 1 } },
      })
      return NextResponse.redirect(url.targetUrl)
    }

    // 2. Fall back to user profile lookup (urlId, vanityId, or username)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { urlId: shortCode },
          { vanityId: shortCode },
          { name: { equals: shortCode, mode: 'insensitive' } },
        ],
        isProfilePublic: true,
      },
      select: { urlId: true, vanityId: true, name: true },
    })

    if (user) {
      // Prefer vanityId → urlId → name for the profile URL
      const slug = user.vanityId || user.urlId || shortCode
      return NextResponse.redirect(new URL(`/user/${slug}`, req.url))
    }

    return new NextResponse(null, { status: 404 })
  } catch (error) {
    console.error('URL redirect error:', error)
    return new NextResponse(null, { status: 500 })
  }
}
