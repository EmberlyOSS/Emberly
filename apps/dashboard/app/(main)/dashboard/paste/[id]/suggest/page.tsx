import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { SuggestEditForm } from '@/components/dashboard/suggest-edit-form'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

import { authOptions } from '@/lib/auth'
import { prisma } from '@emberly/db'
import { getStorageProvider } from '@/lib/storage'

interface SuggestEditPageProps {
  params: Promise<{ id: string }>
}

export default async function SuggestEditPage({
  params,
}: SuggestEditPageProps) {
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
    !isOwner && (collaborator?.role === 'SUGGESTER' || file.allowSuggestions)

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
    <DashboardShell
      title="Suggest an edit"
      description={
        <>
          Suggest changes to{' '}
          <span className="font-medium text-foreground">{file.name}</span> by{' '}
          {file.user?.name || file.user?.urlId}
        </>
      }
    >
      <div className="glass-card p-6">
        <SuggestEditForm file={file} initialContent={content} />
      </div>
    </DashboardShell>
  )
}
