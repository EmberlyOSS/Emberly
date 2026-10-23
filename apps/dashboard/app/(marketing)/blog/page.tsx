import Link from 'next/link'

import { format } from 'date-fns'
import { ArrowRight, Clock, FileText } from 'lucide-react'

import PageShell from '@/components/layout/PageShell'
import { estimateReadTime, listPosts } from '@/lib/blog'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Blog',
  description: 'News, guides and updates from the Emberly team.',
})

type Post = Awaited<ReturnType<typeof listPosts>>[number]

function Byline({ post }: { post: Post }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {post.author && (
        <span className="flex items-center gap-2">
          {post.author.image ? (
            <img
              src={post.author.image}
              alt=""
              className="h-5 w-5 rounded-full ring-1 ring-border"
            />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
              {(post.author.name || 'A').charAt(0)}
            </span>
          )}
          <span className="font-medium text-foreground">
            {post.author.name}
          </span>
        </span>
      )}
      {post.publishedAt && (
        <time dateTime={post.publishedAt.toISOString()}>
          {format(post.publishedAt, 'MMM d, yyyy')}
        </time>
      )}
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {estimateReadTime(post.content || '')} min read
      </span>
    </div>
  )
}

export default async function BlogListPage() {
  const posts = await listPosts({ publishedOnly: true, limit: 30, offset: 0 })
  const [featured, ...rest] = posts

  return (
    <PageShell
      eyebrow="Blog"
      title="News & updates"
      subtitle="Announcements, guides and behind-the-scenes notes from the Emberly team."
    >
      {!featured ? (
        <div className="glass-card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <p className="font-medium">No posts yet</p>
          <p className="text-sm text-muted-foreground">Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Link href={`/blog/${featured.slug}`} className="group block">
            <article className="glass-card glass-hover relative overflow-hidden p-6 sm:p-10">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative max-w-3xl space-y-4">
                <span className="inline-flex rounded-md border border-primary/30 px-2 py-0.5 text-xs font-medium text-primary">
                  Latest
                </span>
                <h2 className="text-2xl font-bold tracking-tight transition-colors group-hover:text-primary sm:text-3xl">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {featured.excerpt}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <Byline post={featured} />
                  <span className="flex items-center gap-1 text-sm font-medium text-primary">
                    Read post
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </article>
          </Link>

          {rest.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {rest.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <article className="glass-card glass-hover flex h-full flex-col gap-3 p-6">
                    <h2 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-auto pt-2">
                      <Byline post={post} />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}
