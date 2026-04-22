import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/packages/lib/database/prisma'
import {
  hasValidInternalApiSecret,
  internalApiSecretConfigured,
} from '@/packages/lib/security/internal-api'

/**
 * Internal API endpoint to look up a custom domain and return the owner's profile info.
 * Used by the middleware/proxy to route custom domain root URLs to the owner's profile.
 * Edge middleware can't use Prisma directly, so this endpoint bridges that gap.
 */
export async function GET(request: NextRequest) {
  if (!internalApiSecretConfigured()) {
    return NextResponse.json({ error: 'Internal API secret is not configured' }, { status: 503 })
  }

  if (!hasValidInternalApiSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hostname = request.nextUrl.searchParams.get('hostname')
  if (!hostname) {
    return NextResponse.json({ error: 'Missing hostname parameter' }, { status: 400 })
  }

  try {
    const domain = await prisma.customDomain.findUnique({
      where: { domain: hostname },
      select: {
        verified: true,
        user: {
          select: {
            urlId: true,
            vanityId: true,
            name: true,
            isProfilePublic: true,
          },
        },
      },
    })

    if (!domain || !domain.verified) {
      return NextResponse.json({ found: false })
    }

    const user = domain.user
    const profileSlug = user.vanityId || user.urlId || user.name

    return NextResponse.json({
      found: true,
      profileSlug,
      isProfilePublic: user.isProfilePublic,
    })
  } catch (error) {
    console.error('Error looking up domain:', error)
    return NextResponse.json({ found: false })
  }
}
