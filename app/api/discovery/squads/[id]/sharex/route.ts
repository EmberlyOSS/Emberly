import { NextResponse } from 'next/server'

import { requireAuth } from '@/packages/lib/auth/api-auth'
import { prisma } from '@/packages/lib/database/prisma'
import { urlForHost } from '@/packages/lib/utils'

/** GET /api/discovery/squads/:id/sharex — download a ShareX .sxcu config wired to the squad's upload token */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req)
  if (response) return response

  const { id } = await params

  // Must be a member
  const member = await prisma.nexiumSquadMember.findUnique({
    where: { squadId_userId: { squadId: id, userId: user.id } },
    select: { role: true },
  })
  if (!member) {
    return NextResponse.json({ error: 'Not a squad member' }, { status: 403 })
  }

  const squad = await prisma.nexiumSquad.findUnique({
    where: { id },
    select: {
      name: true,
      slug: true,
      uploadToken: true,
      customDomains: {
        where: { verified: true, isPrimary: true },
        select: { domain: true },
        take: 1,
      },
    },
  })

  if (!squad) {
    return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
  }

  if (!squad.uploadToken) {
    return NextResponse.json(
      { error: 'No upload token set — the squad owner must generate one first' },
      { status: 400 }
    )
  }

  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXTAUTH_URL?.replace(/\/$/, '') || ''

  // Prefer squad's primary custom domain, else default
  const primaryDomain = squad.customDomains[0]?.domain
  const requestBaseUrl = primaryDomain
    ? urlForHost(primaryDomain).replace(/\/+$/, '')
    : baseUrl.replace(/\/+$/, '')

  const config = {
    Version: '15.0.0',
    Name: `Emberly – ${squad.name}`,
    DestinationType: 'ImageUploader, TextUploader, FileUploader',
    RequestMethod: 'POST',
    RequestURL: `${requestBaseUrl}/api/files`,
    Headers: {
      Authorization: `Bearer ${squad.uploadToken}`,
    },
    Body: 'MultipartFormData',
    FileFormName: 'file',
    URL: '{json:data.url}',
    ThumbnailURL: '{json:data.url}',
    DeletionURL: '',
    ErrorMessage: '{json:error}',
  }

  const sanitizedName = squad.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')

  return new NextResponse(JSON.stringify(config, null, 2), {
    headers: {
      'Content-Disposition': `attachment; filename="${sanitizedName}-squad-sharex.sxcu"`,
      'Content-Type': 'application/json',
    },
  })
}
