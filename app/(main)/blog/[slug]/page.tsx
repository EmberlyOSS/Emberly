import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { getPostBySlug } from '@/lib/blog'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug, true)

  if (!post) {
    return {
      title: 'Post not found',
    }
  }

  return {
    title: post.title,
    description: post.excerpt || `${post.title} - Emberly Blog`,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug, true)
  if (!post) return notFound()

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 animate-fade-in">
      <article className="glass-card p-8 gradient-bg rounded-2xl shadow-xl border border-white/10">
        {/* HEADER */}
        <header className="mb-10">
          <h1
            className="
              text-4xl md:text-5xl font-extrabold leading-tight 
              tracking-tight emberly-text
              bg-gradient-to-r from-foreground via-muted-foreground/80 to-foreground
              bg-clip-text text-transparent
            "
          >
            {post.title}
          </h1>

          {/* AUTHOR */}
          <div className="flex items-center gap-4 mt-6">
            {post.author?.image ? (
              <img
                src={post.author.image}
                alt={post.author.name || 'Author'}
                className="h-12 w-12 rounded-full border border-white/10 shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted/30 border border-white/10 flex items-center justify-center text-lg font-semibold">
                {(post.author?.name || 'A').charAt(0)}
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <div className="font-medium text-foreground text-base">
                {post.author?.name ?? 'Unknown author'}
              </div>
              <div className="opacity-80">
                {post.publishedAt
                  ? format(new Date(post.publishedAt), 'PPP')
                  : 'Unpublished'}
              </div>
            </div>
          </div>
        </header>

        {/* DIVIDER */}
        <div className="h-px w-full bg-white/10 my-8" />

        {/* CONTENT */}
        <div className="mt-6 prose prose-invert prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  )
}
