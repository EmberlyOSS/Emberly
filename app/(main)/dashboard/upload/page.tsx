import { UploadForm } from '@/packages/components/file/upload-form'
import { DashboardShell } from '@/packages/components/dashboard/dashboard-shell'

import { buildPageMetadata } from '@/packages/lib/embeds/metadata'
import { getConfig } from '@/packages/lib/config'
import { prisma } from '@/packages/lib/database/prisma'
import { formatBytes } from '@/packages/lib/utils'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/packages/lib/auth'

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
    redirect('/auth/login')
  }

  const config = await getConfig()
  const { value, unit } = config.settings.general.storage.maxUploadSize
  const maxSizeBytes =
    value * (unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024)
  const formattedMaxSize = formatBytes(maxSizeBytes)

  return (
    <DashboardShell
      header={
        <div className="glass-card">
          <div className="p-8">
            <h1 className="text-3xl font-bold tracking-tight">Upload Files</h1>
            <p className="text-muted-foreground mt-2">
              Upload and share files with optional password protection
            </p>
          </div>
        </div>
      }
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
