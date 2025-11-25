'use client'

import { useEffect, useState } from 'react'

type Post = {
  id: string
  title: string
  slug: string
  status: string
  publishedAt?: string | null
}

export function BlogList({ onEdit }: { onEdit?: (id: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/posts?all=true&limit=100', {
        credentials: 'include',
      })
      const json = await res.json()
      setPosts(json.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Delete failed')
      await load()
    } catch (e) {
      alert(String(e))
    }
  }

  return (
    <div>
      {loading && <div>Loading posts...</div>}
      {!loading && posts.length === 0 && (
        <div className="text-muted-foreground">No posts yet.</div>
      )}

      <div className="grid gap-3">
        {posts.map((p) => (
          <div
            key={p.id}
            className="p-4 bg-background/5 border border-border/20 rounded-xl flex items-start justify-between"
          >
            <div>
              <div className="font-medium text-lg">{p.title}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {p.slug} • {p.status}{' '}
                {p.publishedAt
                  ? `• ${new Date(p.publishedAt).toLocaleString()}`
                  : ''}
              </div>
              {p.excerpt && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {p.excerpt}
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2 ml-4">
              <button className="btn" onClick={() => onEdit?.(p.id)}>
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(p.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BlogList
