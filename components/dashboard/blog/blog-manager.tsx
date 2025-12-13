"use client"

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { BlogEditor } from './blog-editor'
import BlogHelp from './blog-help'
import { BlogList } from './blog-list'

export function BlogManager() {
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  return (
    <div className="container space-y-6">
      <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
        <div className="relative p-8">
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground mt-2">Create and manage posts for the public blog.</p>
        </div>
      </div>

      <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Posts</h3>
            <Button onClick={() => setEditingPostId('')}>+ New Post</Button>
          </div>

          {editingPostId !== null && (
            <div className="mt-6 rounded-2xl bg-background/40 border border-border/40 p-4 shadow-sm">
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

          <div className="mt-6">
            <BlogList key={refreshKey} onEdit={(id) => setEditingPostId(id)} />
          </div>
        </div>
      </div>

      <BlogHelp />
    </div>
  )
}

export default BlogManager
