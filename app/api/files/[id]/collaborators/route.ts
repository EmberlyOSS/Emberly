import { NextResponse } from 'next/server'
import { requireAuth } from '@/packages/lib/auth/api-auth'

import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { sendTemplateEmail, FileSharedEmail } from '@/packages/lib/emails'

const logger = loggers.files

// Get collaborators for a file
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { user, response } = await requireAuth(request)
        if (response) return response

        const file = await prisma.file.findUnique({
            where: { id },
            select: {
                userId: true,
                allowSuggestions: true,
                collaborators: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                urlId: true,
                            },
                        },
                    },
                },
            },
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Only owner can view collaborators
        if (file.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        return NextResponse.json({
            collaborators: file.collaborators,
            allowSuggestions: file.allowSuggestions,
        })
    } catch (error) {
        logger.error('Failed to get collaborators', error as Error)
        return NextResponse.json(
            { error: 'Failed to get collaborators' },
            { status: 500 }
        )
    }
}

// Add a collaborator
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { user, response } = await requireAuth(request)
        if (response) return response

        const file = await prisma.file.findUnique({
            where: { id },
            select: { userId: true, name: true, urlPath: true },
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (file.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { userEmail, userUrlId, role = 'EDITOR' } = body

        if (!userEmail && !userUrlId) {
            return NextResponse.json(
                { error: 'User email or URL ID is required' },
                { status: 400 }
            )
        }

        // Find user by email or urlId
        const targetUser = await prisma.user.findFirst({
            where: userEmail
                ? { email: userEmail }
                : { OR: [{ urlId: userUrlId }, { vanityId: userUrlId }] },
            select: { id: true, name: true, email: true, image: true, urlId: true },
        })

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (targetUser.id === user.id) {
            return NextResponse.json(
                { error: 'Cannot add yourself as a collaborator' },
                { status: 400 }
            )
        }

        // Check if already a collaborator
        const existing = await prisma.fileCollaborator.findUnique({
            where: {
                fileId_userId: {
                    fileId: id,
                    userId: targetUser.id,
                },
            },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'User is already a collaborator' },
                { status: 400 }
            )
        }

        const collaborator = await prisma.fileCollaborator.create({
            data: {
                fileId: id,
                userId: targetUser.id,
                role: role === 'SUGGESTER' ? 'SUGGESTER' : 'EDITOR',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        urlId: true,
                    },
                },
            },
        })

        logger.info('Collaborator added', {
            fileId: id,
            collaboratorId: targetUser.id,
            role,
        })

        // Send notification email to the newly added collaborator (fire-and-forget)
        if (targetUser.email) {
            const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'https://embrly.ca'
            const fileUrl = `${baseUrl}${file.urlPath}`
            const dashboardUrl = `${baseUrl}/dashboard/files`

            sendTemplateEmail({
                to: targetUser.email,
                subject: `${user.name || 'Someone'} shared a file with you`,
                template: FileSharedEmail,
                props: {
                    recipientName: targetUser.name ?? undefined,
                    ownerName: user.name || 'A user',
                    fileName: file.name,
                    fileUrl,
                    role: role === 'SUGGESTER' ? 'SUGGESTER' : 'EDITOR',
                    dashboardUrl,
                },
                skipTracking: false,
                templateName: 'file-shared',
            }).catch((err) => logger.error('Failed to send file-shared email', err as Error))
        }

        return NextResponse.json({ collaborator })
    } catch (error) {
        logger.error('Failed to add collaborator', error as Error)
        return NextResponse.json(
            { error: 'Failed to add collaborator' },
            { status: 500 }
        )
    }
}

// Update file collaboration settings
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { user, response } = await requireAuth(request)
        if (response) return response

        const file = await prisma.file.findUnique({
            where: { id },
            select: { userId: true },
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (file.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { allowSuggestions } = body

        const updatedFile = await prisma.file.update({
            where: { id },
            data: {
                allowSuggestions: Boolean(allowSuggestions),
            },
            select: {
                allowSuggestions: true,
            },
        })

        return NextResponse.json(updatedFile)
    } catch (error) {
        logger.error('Failed to update collaboration settings', error as Error)
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        )
    }
}

// Remove a collaborator
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { user, response } = await requireAuth(request)
        if (response) return response

        const { searchParams } = new URL(request.url)
        const collaboratorId = searchParams.get('collaboratorId')

        if (!collaboratorId) {
            return NextResponse.json(
                { error: 'Collaborator ID is required' },
                { status: 400 }
            )
        }

        const file = await prisma.file.findUnique({
            where: { id },
            select: { userId: true },
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (file.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.fileCollaborator.delete({
            where: { id: collaboratorId },
        })

        logger.info('Collaborator removed', {
            fileId: id,
            collaboratorId,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        logger.error('Failed to remove collaborator', error as Error)
        return NextResponse.json(
            { error: 'Failed to remove collaborator' },
            { status: 500 }
        )
    }
}

