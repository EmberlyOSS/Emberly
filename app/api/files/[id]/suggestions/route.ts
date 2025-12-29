import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { getStorageProvider } from '@/packages/lib/storage'

const logger = loggers.files

// Get suggestions for a file
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
            select: { userId: true },
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Only owner can view suggestions
        if (file.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'PENDING'

        const suggestions = await prisma.fileEditSuggestion.findMany({
            where: {
                fileId: id,
                status: status as 'PENDING' | 'APPROVED' | 'REJECTED',
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
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ suggestions })
    } catch (error) {
        logger.error('Failed to get suggestions', error as Error)
        return NextResponse.json(
            { error: 'Failed to get suggestions' },
            { status: 500 }
        )
    }
}

// Submit a suggestion
export async function POST(
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
                mimeType: true,
                collaborators: {
                    where: { userId: session.user.id },
                },
            },
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Check permission: owner, collaborator (SUGGESTER), or public suggestions enabled
        const isOwner = file.userId === session.user.id
        const collaborator = file.collaborators[0]
        const canSuggest =
            isOwner ||
            collaborator?.role === 'SUGGESTER' ||
            file.allowSuggestions

        if (!canSuggest) {
            return NextResponse.json(
                { error: 'You do not have permission to suggest edits' },
                { status: 403 }
            )
        }

        // Owner shouldn't need to suggest edits to their own file
        if (isOwner) {
            return NextResponse.json(
                { error: 'Owners should edit directly, not suggest' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { content, message } = body

        if (typeof content !== 'string' || !content.trim()) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            )
        }

        const suggestion = await prisma.fileEditSuggestion.create({
            data: {
                fileId: id,
                userId: session.user.id,
                content,
                message: message || null,
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

        logger.info('Edit suggestion submitted', {
            fileId: id,
            suggestionId: suggestion.id,
            userId: session.user.id,
        })

        return NextResponse.json({ suggestion })
    } catch (error) {
        logger.error('Failed to submit suggestion', error as Error)
        return NextResponse.json(
            { error: 'Failed to submit suggestion' },
            { status: 500 }
        )
    }
}

// Approve or reject a suggestion
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { suggestionId, action } = body

        if (!suggestionId || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'suggestionId and action (approve/reject) are required' },
                { status: 400 }
            )
        }

        const suggestion = await prisma.fileEditSuggestion.findUnique({
            where: { id: suggestionId },
            include: {
                file: {
                    select: {
                        id: true,
                        userId: true,
                        path: true,
                        mimeType: true,
                        size: true,
                    },
                },
            },
        })

        if (!suggestion) {
            return NextResponse.json(
                { error: 'Suggestion not found' },
                { status: 404 }
            )
        }

        // Only owner can approve/reject
        if (suggestion.file.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (suggestion.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Suggestion has already been reviewed' },
                { status: 400 }
            )
        }

        if (action === 'approve') {
            // Apply the suggestion to the file
            const storageProvider = await getStorageProvider()
            const buffer = Buffer.from(suggestion.content, 'utf-8')
            const newSize = buffer.length

            await storageProvider.uploadFile(
                buffer,
                suggestion.file.path,
                suggestion.file.mimeType
            )

            const sizeDifference = newSize - suggestion.file.size

            await prisma.$transaction(async (tx) => {
                // Update file size
                await tx.file.update({
                    where: { id: suggestion.file.id },
                    data: {
                        size: newSize,
                        updatedAt: new Date(),
                    },
                })

                // Update user storage
                if (sizeDifference !== 0) {
                    await tx.user.update({
                        where: { id: suggestion.file.userId },
                        data: {
                            storageUsed: { increment: sizeDifference },
                        },
                    })
                }

                // Update suggestion status
                await tx.fileEditSuggestion.update({
                    where: { id: suggestionId },
                    data: {
                        status: 'APPROVED',
                        reviewedAt: new Date(),
                        reviewedBy: session.user.id,
                    },
                })
            })

            logger.info('Suggestion approved and applied', {
                suggestionId,
                fileId: suggestion.file.id,
                reviewedBy: session.user.id,
            })

            return NextResponse.json({
                success: true,
                status: 'APPROVED',
                message: 'Suggestion approved and applied',
            })
        } else {
            // Reject the suggestion
            await prisma.fileEditSuggestion.update({
                where: { id: suggestionId },
                data: {
                    status: 'REJECTED',
                    reviewedAt: new Date(),
                    reviewedBy: session.user.id,
                },
            })

            logger.info('Suggestion rejected', {
                suggestionId,
                fileId: suggestion.file.id,
                reviewedBy: session.user.id,
            })

            return NextResponse.json({
                success: true,
                status: 'REJECTED',
                message: 'Suggestion rejected',
            })
        }
    } catch (error) {
        logger.error('Failed to review suggestion', error as Error)
        return NextResponse.json(
            { error: 'Failed to review suggestion' },
            { status: 500 }
        )
    }
}

// Delete a suggestion (by author or owner)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const suggestionId = searchParams.get('suggestionId')

        if (!suggestionId) {
            return NextResponse.json(
                { error: 'suggestionId is required' },
                { status: 400 }
            )
        }

        const suggestion = await prisma.fileEditSuggestion.findUnique({
            where: { id: suggestionId },
            include: {
                file: { select: { userId: true } },
            },
        })

        if (!suggestion) {
            return NextResponse.json(
                { error: 'Suggestion not found' },
                { status: 404 }
            )
        }

        // Only author or file owner can delete
        const canDelete =
            suggestion.userId === session.user.id ||
            suggestion.file.userId === session.user.id

        if (!canDelete) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.fileEditSuggestion.delete({
            where: { id: suggestionId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        logger.error('Failed to delete suggestion', error as Error)
        return NextResponse.json(
            { error: 'Failed to delete suggestion' },
            { status: 500 }
        )
    }
}
