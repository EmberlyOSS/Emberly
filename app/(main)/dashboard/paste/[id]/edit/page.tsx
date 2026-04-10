import { notFound, redirect } from 'next/navigation'

import { Code2 } from 'lucide-react'
import { getServerSession } from 'next-auth'

import { EditPasteForm } from '@/packages/components/dashboard/edit-paste-form'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

import { authOptions } from '@/packages/lib/auth'
import { prisma } from '@/packages/lib/database/prisma'
import { getStorageProvider } from '@/packages/lib/storage'

interface EditPastePageProps {
    params: Promise<{ id: string }>
}

export default async function EditPastePage({ params }: EditPastePageProps) {
    const { id } = await params
    const session = await getServerSession(authOptions)

    const file = await prisma.file.findUnique({
        where: { id },
    })

    if (!file) {
        notFound()
    }

    if (!session?.user?.id) {
        redirect('/dashboard')
    }

    // Check ownership
    if (file.userId !== session.user.id) {
        redirect('/dashboard')
    }

    // Check if it's a text-based file
    const isTextBased =
        file.mimeType.startsWith('text/') ||
        file.mimeType === 'application/json' ||
        file.mimeType === 'application/javascript' ||
        file.mimeType === 'application/typescript' ||
        file.mimeType === 'application/xml'

    if (!isTextBased) {
        redirect('/dashboard')
    }

    // Get file content
    const storageProvider = await getStorageProvider()
    const buffer = await storageProvider.getFile(file.path)
    const content = buffer.toString('utf-8')

    return (
        <DashboardShell>
            <div className="glass-card overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Code2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Edit Paste</h1>
                        <p className="text-sm text-muted-foreground">
                            Update your code snippet or paste content.
                        </p>
                    </div>
                </div>
                <div className="p-6">
                    <EditPasteForm file={file} initialContent={content} />
                </div>
            </div>
        </DashboardShell>
    )
}
