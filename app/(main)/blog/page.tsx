import Link from 'next/link'

import { format } from 'date-fns'

import { listPosts } from '@/packages/lib/blog'
import PageShell from '@/packages/components/layout/PageShell'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/packages/components/ui/table'

export default async function BlogListPage() {
  const posts = await listPosts({ publishedOnly: true, limit: 20, offset: 0 })

  return (
    <PageShell title="Emberly Blog" subtitle="News, tips and updates about Emberly and file sharing best practices.">
      <div className="max-w-7xl mx-auto py-0 px-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2">
            <div className="rounded-2xl border border-border/30 bg-background/40 p-4">
              {posts.length === 0 ? (
                <div className="text-muted-foreground">No posts yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Post</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead />
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {posts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">
                            <Link href={`/blog/${p.slug}`} className="hover:underline">
                              {p.title}
                            </Link>
                          </div>
                          {p.excerpt && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {p.excerpt}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {p.publishedAt ? format(new Date(p.publishedAt), 'PPP') : 'Unpublished'}
                        </TableCell>

                        <TableCell>{p.author?.name ?? '—'}</TableCell>

                        <TableCell>
                          <Link href={`/blog/${p.slug}`} className="text-primary font-medium">
                            Read →
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
    </PageShell>
  )
}
