import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { SuggestEditForm } from '@/packages/components/dashboard/suggest-edit-form'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { getStorageProvider } from '@/packages/lib/storage'

interface SuggestEditPageProps {
    params: Promise<{ id: string }>
}

export default async function SuggestEditPage({ params }: SuggestEditPageProps) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) redirect('/auth/login')

    // Get file with collaboration info
    const file = await prisma.file.findUnique({
        where: { id },
        include: {
            collaborators: {
                where: { userId: session.user.id },
                select: { role: true },
            },
            user: {
                select: { name: true, urlId: true },
            },
        },
    })

    if (!file) {
        redirect('/dashboard')
    }

    // Check if user can suggest
    const isOwner = file.userId === session.user.id
    const collaborator = file.collaborators[0]
    const canSuggest =
        !isOwner &&
        (collaborator?.role === 'SUGGESTER' || file.allowSuggestions)

    // If they're an editor, redirect to edit page instead
    if (collaborator?.role === 'EDITOR') {
        redirect(`/dashboard/paste/${id}/edit`)
    }

    if (!canSuggest) {
        redirect(`/${file.urlPath}`)
    }

    // Get current content
    const storageProvider = await getStorageProvider()
    let content = ''
    try {
        const buffer = await storageProvider.getFile(file.path)
        content = buffer.toString('utf-8')
    } catch {
        // File might not exist
    }

    return (
        <DashboardShell>
            <div className="glass-card overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/30">
                    <div>
                        <h1 className="text-xl font-semibold">Suggest Edit</h1>
                        <p className="text-sm text-muted-foreground">
                            Suggest changes to <span className="font-medium">{file.name}</span> by {file.user?.name || file.user?.urlId}
                        </p>
                    </div>
                </div>
                <div className="p-6">
                    <SuggestEditForm file={file} initialContent={content} />
                </div>
            </div>
        </DashboardShell>
    )
}
