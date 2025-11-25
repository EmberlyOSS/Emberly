'use client'

import { useState } from 'react'

import { BlogEditor } from './blog-editor'
import BlogHelp from './blog-help'
import { BlogList } from './blog-list'

export function BlogManager() {
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blog Management</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage posts for the public blog.
            </p>
          </div>
          <div>
            <button
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-md shadow-md hover:opacity-95"
              onClick={() => setEditingPostId('')}
            >
              + New Post
            </button>
          </div>
        </div>

        {editingPostId !== null && (
          <div className="rounded-2xl bg-background/40 border border-border/40 p-4 shadow-sm">
            <BlogEditor
              key={editingPostId ?? 'editor'}
              postId={editingPostId ?? undefined}
              onSaved={() => {
                setEditingPostId(null)
                setRefreshKey((k) => k + 1)
              }}
              onCancel={() => setEditingPostId(null)}
            />
          </div>
        )}

        <div className="rounded-2xl bg-background/30 border border-border/30 p-4">
          <h3 className="text-lg font-semibold mb-4">Posts</h3>
          <BlogList key={refreshKey} onEdit={(id) => setEditingPostId(id)} />
        </div>
      </div>

      <aside>
        <div className="sticky top-24 space-y-4">
          <div className="rounded-2xl bg-background/20 border border-border/30 p-4">
            <h4 className="text-lg font-semibold">Quick Actions</h4>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div>
                • Create a new post with the <strong>+ New Post</strong> button.
              </div>
              <div>
                • Use the editor to write markdown and preview on the right.
              </div>
              <div>
                • Set status to <em>Published</em> to make it public
                immediately.
              </div>
            </div>
          </div>

          <BlogHelp />
        </div>
      </aside>
    </div>
  )
}

export default BlogManager
