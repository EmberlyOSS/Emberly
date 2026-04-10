import dynamic from 'next/dynamic'

import { AdminShell } from '@/packages/components/admin/admin-shell'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Blog Management',
  description: 'Publish and curate blog posts and announcements.',
})

const BlogManager = dynamic(() =>
  import('@/packages/components/admin/blog/blog-manager').then((m) => m.BlogManager)
)

export default async function BlogDashboardPage() {

  return (
    <AdminShell header={
      <div className="glass-card">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground mt-2">Publish and curate blog posts and announcements.</p>
        </div>
      </div>
    }>
      <BlogManager />
    </AdminShell>
  )
}
