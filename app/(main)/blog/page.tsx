import Link from 'next/link'

import { format, formatDistanceToNow } from 'date-fns'
import { Calendar, User, ArrowRight, BookOpen, MessageCircle, ExternalLink, FileText } from 'lucide-react'

import { listPosts } from '@/packages/lib/blog'
import PageShell from '@/packages/components/layout/PageShell'
import { Badge } from '@/packages/components/ui/badge'
import { buildPageMetadata } from '@/packages/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Blog',
  description: 'News, tips and updates about Emberly and file sharing best practices.',
})

export default async function BlogListPage() {
  const posts = await listPosts({ publishedOnly: true, limit: 20, offset: 0 })

  return (
    <PageShell title="Emberly Blog" subtitle="News, tips and updates about Emberly and file sharing best practices." bodyVariant="plain">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Blog posts */}
          <main className="lg:col-span-2 space-y-6">
            {posts.length === 0 ? (
              <div className="glass-subtle p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">No posts yet</p>
                    <p className="text-sm text-muted-foreground">Check back soon for updates!</p>
                  </div>
                </div>
              </div>
            ) : (
              posts.map((p, index) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="block group">
                  <article className="glass-subtle glass-hover overflow-hidden">

                    {/* Featured badge for first post */}
                    {index === 0 && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                        <Badge className="bg-primary/20 text-primary border-0 font-medium text-xs">
                          Latest
                        </Badge>
                      </div>
                    )}

                    <div className="relative p-4 sm:p-6">
                      <div className="space-y-2 sm:space-y-3">
                        {/* Title */}
                        <h2 className="text-lg sm:text-xl font-semibold tracking-tight group-hover:text-primary transition-colors pr-16 sm:pr-20">
                          {p.title}
                        </h2>

                        {/* Excerpt */}
                        {p.excerpt && (
                          <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                            {p.excerpt}
                          </p>
                        )}

                        {/* Meta info */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 pt-2">
                          {/* Author */}
                          {p.author && (
                            <div className="flex items-center gap-2">
                              {p.author.image ? (
                                <img
                                  src={p.author.image}
                                  alt={p.author.name || 'Author'}
                                  className="h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-2 ring-white/10"
                                />
                              ) : (
                                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                  {(p.author.name || 'A').charAt(0)}
                                </div>
                              )}
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {p.author.name}
                              </span>
                            </div>
                          )}

                          {/* Date */}
                          {p.publishedAt && (
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>{format(new Date(p.publishedAt), 'MMM d, yyyy')}</span>
                              <span className="text-muted-foreground/60 hidden sm:inline">
                                ({formatDistanceToNow(new Date(p.publishedAt), { addSuffix: true })})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Read more indicator - visible on mobile, hover on desktop */}
                      <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary mt-4 sm:mt-0 sm:absolute sm:bottom-6 sm:right-6 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <span>Read more</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* About card */}
              <div className="glass-subtle overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">About this blog</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Announcements, how-to guides, and updates from the Emberly team. Stay up to date with the latest features and best practices.
                  </p>
                </div>
              </div>

              {/* Quick Links card */}
              <div className="glass-subtle overflow-hidden">
                <div className="p-5">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Quick Links</h4>
                  <ul className="space-y-3">
                    <li>
                      <Link
                        href="/discord"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                      >
                        <MessageCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span>Join our Discord</span>
                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground/50" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/changelogs"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span>Changelogs</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/legal"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                      >
                        <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span>Legal</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Stats card */}
              <div className="glass-subtle overflow-hidden">
                <div className="p-5">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{posts.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">Published articles</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
