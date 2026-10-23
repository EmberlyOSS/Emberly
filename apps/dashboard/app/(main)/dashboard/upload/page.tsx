import { UploadForm } from '@/components/file/upload-form'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

import { buildPageMetadata } from '@/lib/embeds/metadata'
import { getConfig } from '@/lib/config'
import { prisma } from '@emberly/db'
import { formatBytes } from '@/lib/utils'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = buildPageMetadata({
  title: 'Upload Files',
  description: 'Upload and manage your files with Emberly.',
})

export default async function UploadPage() {
  const session = await getServerSession(authOptions)

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      defaultFileExpirationAction: true,
      defaultFileExpiration: true,
    },
  })

  if (!user) {
    return redirect('/auth/login')
  }

  const config = await getConfig()
  const { value, unit } = config.settings.general.storage.maxUploadSize
  const maxSizeBytes =
    value * (unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024)
  const formattedMaxSize = formatBytes(maxSizeBytes)

  return (
    <DashboardShell
      title="Upload Files"
      description="Upload and share files with optional password protection"
    >
      <UploadForm
        user={{
          id: user.id,
          defaultFileExpiration: user.defaultFileExpiration,
          defaultFileExpirationAction: user.defaultFileExpirationAction,
        }}
        maxSize={maxSizeBytes}
        formattedMaxSize={formattedMaxSize}
      />
    </DashboardShell>
  )
}
