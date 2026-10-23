import { notFound, redirect } from 'next/navigation'

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
    <DashboardShell
      title="Edit Paste"
      description="Update your code snippet or paste content."
    >
      <div className="glass-card p-6">
        <EditPasteForm file={file} initialContent={content} />
      </div>
    </DashboardShell>
  )
}
