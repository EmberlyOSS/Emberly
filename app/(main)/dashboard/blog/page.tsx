import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper'
import { getServerSession } from 'next-auth'
import { getConfig } from '@/lib/config'
import { authOptions } from '@/lib/auth'

const BlogManager = dynamic(() =>
  import('@/components/dashboard/blog/blog-manager').then((m) => m.BlogManager)
)

export default async function BlogDashboardPage() {

  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const config = await getConfig()
  const { value, unit } = config.settings.general.storage.maxUploadSize
  const maxSizeBytes =
    value * (unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024)

  return (
    <DashboardWrapper showFooter={false} maxUploadSize={maxSizeBytes}>
      <BlogManager />
    </DashboardWrapper>
  )
}
