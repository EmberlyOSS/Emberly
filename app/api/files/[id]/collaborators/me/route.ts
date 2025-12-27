import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'

// Get current user's collaborator status for a file
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const file = await prisma.file.findUnique({
            where: { id },
            select: {
                userId: true,
                allowSuggestions: true,
                collaborators: {
                    where: { userId: session.user.id },
                    select: { role: true },
                },
            },
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Check if user is a collaborator
        const collaborator = file.collaborators[0]

        return NextResponse.json({
            isOwner: file.userId === session.user.id,
            role: collaborator?.role || null,
            allowSuggestions: file.allowSuggestions,
        })
    } catch (error) {
        console.error('Failed to get collaborator status', error)
        return NextResponse.json(
            { error: 'Failed to get collaborator status' },
            { status: 500 }
        )
    }
}
