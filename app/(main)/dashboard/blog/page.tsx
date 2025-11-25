import dynamic from 'next/dynamic'

import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper'

import { getConfig } from '@/lib/config'

const BlogManager = dynamic(() =>
  import('@/components/dashboard/blog/blog-manager').then((m) => m.BlogManager)
)

export default async function BlogDashboardPage() {
  const config = await getConfig()
  const { value, unit } = config.settings.general.storage.maxUploadSize
  const maxSizeBytes =
    value * (unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024)

  return (
    <div>
      <div className="max-w-7xl mx-auto py-6 px-4">
        <BlogManager />
      </div>
    </div>
  )
}
