import Link from 'next/link'

import { format } from 'date-fns'

import { listPosts } from '@/lib/blog'

export default async function BlogListPage() {
  const posts = await listPosts({ publishedOnly: true, limit: 20, offset: 0 })

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Emberly Blog
            </h1>
            <p className="mt-2 text-muted-foreground">
              News, tips and updates about Emberly and file sharing best
              practices.
            </p>
          </header>

          <div className="space-y-6">
            {posts.length === 0 && (
              <div className="text-muted-foreground">No posts yet.</div>
            )}

            {posts.map((p) => (
              <article
                key={p.id}
                className="group block p-6 rounded-2xl border border-border/30 bg-background/40 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      <Link
                        href={`/blog/${p.slug}`}
                        className="hover:underline"
                      >
                        {p.title}
                      </Link>
                    </h2>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="text-sm text-muted-foreground">
                        {p.publishedAt
                          ? format(new Date(p.publishedAt), 'PPP')
                          : 'Unpublished'}
                      </div>

                      {p.author?.name && (
                        <div className="text-sm text-muted-foreground">
                          • {p.author.name}
                        </div>
                      )}
                    </div>

                    {p.excerpt && (
                      <p className="mt-4 text-muted-foreground line-clamp-3">
                        {p.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="ml-4">
                    <Link
                      href={`/blog/${p.slug}`}
                      className="inline-flex items-center text-primary font-medium"
                    >
                      Read post
                      <span className="ml-2">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl bg-background/10 border border-border/20 p-4">
              <h3 className="text-lg font-semibold">About this blog</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Announcements, how-to guides, and updates from the Emberly team.
              </p>
            </div>

            <div className="rounded-2xl bg-background/10 border border-border/20 p-4">
              <h4 className="text-sm font-semibold">Quick Links</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/discord" className="text-primary">
                    Join our Discord
                  </Link>
                </li>
                <li>
                  <Link href="/legal" className="text-primary">
                    Legal
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
