import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'

// Get all files shared with the current user
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        // Get files where the user is a collaborator
        const [collaborations, total] = await Promise.all([
            prisma.fileCollaborator.findMany({
                where: {
                    userId: session.user.id,
                },
                include: {
                    file: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    urlId: true,
                                    image: true,
                                },
                            },
                            _count: {
                                select: {
                                    editSuggestions: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.fileCollaborator.count({
                where: {
                    userId: session.user.id,
                },
            }),
        ])

        const files = collaborations.map((collab) => ({
            id: collab.file.id,
            name: collab.file.name,
            urlPath: collab.file.urlPath,
            mimeType: collab.file.mimeType,
            size: collab.file.size,
            visibility: collab.file.visibility,
            uploadedAt: collab.file.uploadedAt,
            updatedAt: collab.file.updatedAt,
            isPaste: collab.file.isPaste,
            role: collab.role,
            owner: collab.file.user,
            pendingSuggestions: collab.file._count.editSuggestions,
        }))

        return NextResponse.json({
            data: files,
            pagination: {
                total,
                page,
                limit,
                pageCount: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Failed to get shared files', error)
        return NextResponse.json(
            { error: 'Failed to get shared files' },
            { status: 500 }
        )
    }
}
