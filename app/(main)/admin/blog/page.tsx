import dynamic from 'next/dynamic'

import { AdminShell } from '@/packages/components/admin/admin-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Blog Management',
  description: 'Publish and curate blog posts and announcements.',
})

const BlogManager = dynamic(() =>
  import('@/packages/components/admin/blog/blog-manager').then(
    (m) => m.BlogManager
  )
)

export default async function BlogDashboardPage() {
  return (
    <AdminShell
      title="Blog Management"
      description="Publish and curate blog posts and announcements."
    >
      <BlogManager />
    </AdminShell>
  )
}
