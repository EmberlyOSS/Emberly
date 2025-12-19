import { notFound } from 'next/navigation'

import { format } from 'date-fns'
import GithubSlugger from 'github-slugger'

import BlogToc, { BlogHeading } from '@/packages/components/docs/BlogToc'
import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'
import PageShell from '@/packages/components/layout/PageShell'
import { getPostBySlug } from '@/packages/lib/blog'

type ParamsPromise = Promise<{ slug: string }>

function extractHeadings(markdown: string): BlogHeading[] {
  const lines = markdown.split('\n')
  const headings: BlogHeading[] = []
  const slugger = new GithubSlugger()

  let inCode = false

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.startsWith('```')) {
      inCode = !inCode
      continue
    }
    if (inCode) continue

    const match = /^(#{2,3})\s+(.*)/.exec(line)
    if (match) {
      const level = match[1].length as 2 | 3
      const text = match[2].trim()
      const id = slugger.slug(text)
      headings.push({ id, text, level })
    }
  }

  return headings
}

export default async function PostPage({ params }: { params: ParamsPromise }) {
  const resolved = await params
  const post = await getPostBySlug(resolved.slug, true)
  if (!post) return notFound()
  const headings = extractHeadings(post.content || '')

  return (
    <PageShell title={post.title} subtitle={post.excerpt ?? 'Blog post'} bodyVariant="plain">
      <section className="mx-auto px-4">
        <div className="mt-6 lg:grid lg:grid-cols-[240px,1fr] gap-10">
          <div>
            <BlogToc headings={headings} />
          </div>

          <article className="prose prose-invert max-w-none space-y-6">
            <header className="flex items-center gap-3">
              {post.author?.image ? (
                <img
                  src={post.author.image}
                  alt={post.author.name || 'Author'}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm">
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
            </header>

            <MarkdownRenderer>{post.content}</MarkdownRenderer>
          </article>
        </div>
      </section>
    </PageShell>
  )
}
