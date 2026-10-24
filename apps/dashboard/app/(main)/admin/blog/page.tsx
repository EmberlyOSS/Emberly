import dynamic from 'next/dynamic'

import { AdminShell } from '@/components/admin/admin-shell'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Blog',
  description: 'Publish and curate blog posts and announcements.',
})

const BlogManager = dynamic(() =>
  import('@/components/admin/blog/blog-manager').then((m) => m.BlogManager)
)

export default async function BlogDashboardPage() {
  return (
    <AdminShell
      title="Blog"
      description="Publish and curate blog posts and announcements."
    >
      <BlogManager />
    </AdminShell>
  )
}
