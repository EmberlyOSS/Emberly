import { notFound } from 'next/navigation'

import { format } from 'date-fns'
import MarkdownRenderer from '@/components/docs/MarkdownRenderer'

import { getPostBySlug } from '@/lib/blog'
import PageShell from '@/components/layout/PageShell'

type Props = { params: { slug: string } }

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug, true)
  if (!post) return notFound()

  return (
    <PageShell title={post.title} subtitle={post.excerpt ?? 'Blog post'}>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <article className="prose lg:prose-xl">
          <header className="mb-6">
            <div className="flex items-center gap-3 mt-3">
              {post.author?.image ? (
                <img
                  src={post.author.image}
                  alt={post.author.name || 'Author'}
                  className="h-9 w-9 rounded-full"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm">
                  {(post.author?.name || 'A').charAt(0)}
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <div className="font-medium text-foreground">
                  {post.author?.name ?? 'Unknown author'}
                </div>
                <div>
                  {post.publishedAt
                    ? format(new Date(post.publishedAt), 'PPP')
                    : 'Unpublished'}
                </div>
              </div>
            </div>
          </header>

          <div className="mt-6">
            <MarkdownRenderer>{post.content}</MarkdownRenderer>
          </div>
        </article>
      </div>
    </PageShell>
  )
}
