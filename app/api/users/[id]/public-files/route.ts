import { NextResponse } from 'next/server'
import { prisma } from '@/packages/lib/database/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find user by id, urlId, vanityId, or name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { urlId: id },
          { vanityId: id },
          { name: { equals: id, mode: 'insensitive' } },
        ],
        isProfilePublic: true,
      },
      select: {
        id: true,
        name: true,
        files: {
          where: { visibility: 'PUBLIC' },
          select: {
            id: true,
            name: true,
            urlPath: true,
            mimeType: true,
            size: true,
            views: true,
            downloads: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'desc' },
          take: 20, // Limit to most recent 20 files
        },
      },
    })

    if (!user) {
      return NextResponse.json({ files: [] }, { status: 404 })
    }

    return NextResponse.json({
      files: user.files.map((file) => ({
        ...file,
        // urlPath already includes its leading slash
        url: `/${file.urlPath.replace(/^\/+/, '')}`,
      })),
    })
  } catch (error) {
    console.error('[GET /api/users/[id]/public-files]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
