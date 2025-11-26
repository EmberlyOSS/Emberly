import dynamic from 'next/dynamic'

const BlogManager = dynamic(() =>
  import('@/components/dashboard/blog/blog-manager').then((m) => m.BlogManager)
)

export default async function BlogDashboardPage() {
  return (
    <div>
      <div className="max-w-7xl mx-auto py-6 px-4">
        <BlogManager />
      </div>
    </div>
  )
}
