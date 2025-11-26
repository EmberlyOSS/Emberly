import Link from 'next/link'

import { format } from 'date-fns'
import { ArrowRight, Calendar, User } from 'lucide-react'

import { listPosts } from '@/lib/blog'

export default async function BlogListPage() {
  const posts = await listPosts({ publishedOnly: true, limit: 20, offset: 0 })

  return (
    <div className="max-w-6xl mx-auto py-16 px-6">
      <header className="text-center mb-14">
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
          Emberly Blog
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          News, insights and updates about Emberly — plus file-sharing tips that
          actually matter.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* MAIN LIST */}
        <main className="lg:col-span-2 space-y-7">
          {posts.length === 0 && (
            <div className="text-muted-foreground text-center py-10">
              No articles published yet.
            </div>
          )}

          {posts.map((p) => (
            <article
              key={p.id}
              className="group rounded-3xl border border-border/40 bg-background/50 
                         p-7 hover:shadow-xl hover:border-border/70 transition-all duration-200"
            >
              <Link href={`/blog/${p.slug}`}>
                <h2 className="text-2xl font-semibold group-hover:text-primary transition">
                  {p.title}
                </h2>
              </Link>

              <div className="flex items-center gap-5 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {p.publishedAt
                    ? format(new Date(p.publishedAt), 'PPP')
                    : 'Unpublished'}
                </div>

                {p.author?.name && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {p.author.name}
                  </div>
                )}
              </div>

              {p.excerpt && (
                <p className="mt-4 text-muted-foreground line-clamp-3 text-[15px]">
                  {p.excerpt}
                </p>
              )}

              <Link
                href={`/blog/${p.slug}`}
                className="inline-flex items-center gap-2 mt-5 text-primary font-medium"
              >
                Read post
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </article>
          ))}
        </main>

        {/* SIDEBAR */}
        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-28 h-fit">
          <div className="rounded-3xl bg-background/40 border border-border/30 p-6">
            <h3 className="text-lg font-semibold">About this blog</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Articles, announcements and guides from the Emberly team. Stay
              updated on features, improvements and file-sharing insights.
            </p>
          </div>

          <div className="rounded-3xl bg-background/40 border border-border/30 p-6">
            <h4 className="text-sm font-semibold tracking-wide">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/discord" className="text-primary hover:underline">
                  Join our Discord
                </Link>
              </li>
              <li>
                <Link href="/legal" className="text-primary hover:underline">
                  Legal
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
