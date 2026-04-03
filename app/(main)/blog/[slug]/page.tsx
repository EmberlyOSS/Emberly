import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { format, formatDistanceToNow } from 'date-fns'
import GithubSlugger from 'github-slugger'
import { ArrowLeft, Calendar, User, Clock, Share2 } from 'lucide-react'

import BlogToc, { BlogHeading } from '@/packages/components/shared/BlogToc'
import MarkdownRenderer from '@/packages/components/shared/MarkdownRenderer'
import PageShell from '@/packages/components/layout/PageShell'
import { Button } from '@/packages/components/ui/button'
import { getPostBySlug } from '@/packages/lib/blog'

type ParamsPromise = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: ParamsPromise }): Promise<Metadata> {
  const resolved = await params
  const post = await getPostBySlug(resolved.slug, true)

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  return {
    title: post.title,
    description: post.excerpt || `Read "${post.title}" on the Emberly blog.`,
  }
}

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

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export default async function PostPage({ params }: { params: ParamsPromise }) {
  const resolved = await params
  const post = await getPostBySlug(resolved.slug, true)
  if (!post) return notFound()
  const headings = extractHeadings(post.content || '')
  const readTime = estimateReadTime(post.content || '')

  return (
    <PageShell title={post.title} subtitle={post.excerpt ?? 'Blog post'} bodyVariant="plain">
      <section className="mx-auto px-4 max-w-7xl">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Button>
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-[240px,1fr] gap-10">
          {/* Sidebar with TOC */}
          <div>
            <BlogToc headings={headings} />
          </div>

          {/* Main article content */}
          <article className="space-y-8">
            {/* Article header card */}
            <div className="glass-subtle overflow-hidden">
              <div className="p-6">
                {/* Author and meta */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    {post.author?.image ? (
                      <img
                        src={post.author.image}
                        alt={post.author.name || 'Author'}
                        className="h-12 w-12 rounded-full ring-2 ring-white/10"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-medium text-primary">
                        {(post.author?.name || 'A').charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">
                        {post.author?.name ?? 'Unknown author'}
                      </div>
                      <div className="text-sm text-muted-foreground">Author</div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block h-10 w-px bg-muted/50" />

                  {/* Date and read time */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {post.publishedAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(post.publishedAt), 'MMMM d, yyyy')}</span>
                        <span className="text-muted-foreground/60">
                          ({formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{readTime} min read</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Article body */}
            <div className="glass-subtle overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="prose prose-sm sm:prose dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/50 prose-li:text-muted-foreground prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground prose-hr:border-border/50">
                  <MarkdownRenderer>{post.content}</MarkdownRenderer>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="glass-subtle overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="font-medium">Enjoyed this article?</p>
                    <p className="text-sm text-muted-foreground">Share it with others or check out more posts.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/blog">
                      <Button variant="outline">
                        More posts
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  )
}
