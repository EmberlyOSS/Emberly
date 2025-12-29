import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { loggers } from '@/packages/lib/logger'
import { getStorageProvider } from '@/packages/lib/storage'

const logger = loggers.files

// Update file content (for text-based files like pastes)
export async function PUT(
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
            include: {
                collaborators: {
                    where: { userId: session.user.id },
                },
            },
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Check if user is owner or has EDITOR role
        const isOwner = file.userId === session.user.id
        const collaborator = file.collaborators[0]
        const canEdit = isOwner || collaborator?.role === 'EDITOR'

        if (!canEdit) {
            // Check if they can at least suggest
            const canSuggest = collaborator?.role === 'SUGGESTER' || file.allowSuggestions
            if (canSuggest) {
                return NextResponse.json(
                    { error: 'You can only suggest edits, not edit directly. Use the suggestions endpoint.' },
                    { status: 403 }
                )
            }
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only allow updating text-based files
        const textMimeTypes = [
            'text/plain',
            'text/markdown',
            'text/x-markdown',
            'text/javascript',
            'text/typescript',
            'text/jsx',
            'text/tsx',
            'text/x-python',
            'text/html',
            'text/css',
            'text/xml',
            'text/yaml',
            'text/x-yaml',
            'text/x-sql',
            'text/x-java',
            'text/x-c++src',
            'text/x-csrc',
            'text/x-rustsrc',
            'text/x-go',
            'text/x-php',
            'text/x-sass',
            'text/x-scss',
            'text/x-less',
            'application/json',
            'application/javascript',
            'application/typescript',
            'application/xml',
        ]

        if (!textMimeTypes.includes(file.mimeType) && !file.mimeType.startsWith('text/')) {
            return NextResponse.json(
                { error: 'Only text-based files can be edited' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { content, allowSuggestions } = body

        if (typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Content must be a string' },
                { status: 400 }
            )
        }

        const storageProvider = await getStorageProvider()

        // Convert content to buffer and upload
        const buffer = Buffer.from(content, 'utf-8')
        const newSize = buffer.length

        // Update storage with new content
        await storageProvider.uploadFile(buffer, file.path, file.mimeType)

        // Calculate storage difference
        const sizeDifference = newSize - file.size

        // Prepare update data
        const updateData: {
            size: number
            updatedAt: Date
            allowSuggestions?: boolean
        } = {
            size: newSize,
            updatedAt: new Date(),
        }

        // Only allow owner to change allowSuggestions
        if (isOwner && typeof allowSuggestions === 'boolean') {
            updateData.allowSuggestions = allowSuggestions
        }

        // Update file record
        const updatedFile = await prisma.$transaction(async (tx) => {
            const updated = await tx.file.update({
                where: { id },
                data: updateData,
            })

            // Update file owner's storage usage (not the editor's)
            if (sizeDifference !== 0) {
                await tx.user.update({
                    where: { id: file.userId },
                    data: {
                        storageUsed: {
                            increment: sizeDifference,
                        },
                    },
                })
            }

            return updated
        })

        logger.info('File content updated', {
            fileId: id,
            editorId: session.user.id,
            ownerId: file.userId,
            oldSize: file.size,
            newSize,
        })

        return NextResponse.json({
            success: true,
            file: updatedFile,
        })
    } catch (error) {
        logger.error('File content update error', error as Error)
        return NextResponse.json(
            { error: 'Failed to update file content' },
            { status: 500 }
        )
    }
}
