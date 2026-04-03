"use client"

import { useState } from 'react'

import { FileText, Plus } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { BlogEditor } from './blog-editor'
import BlogHelp from './blog-help'
import { BlogList } from './blog-list'

export function BlogManager() {
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  return (
    <div className="container space-y-6">
      <div className="glass-subtle overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Blog Posts</h3>
              <p className="text-sm text-muted-foreground">Create and manage blog content</p>
            </div>
          </div>
          <Button onClick={() => setEditingPostId('')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>

        <div className="p-4">
          {editingPostId !== null && (
            <div className="mb-6">
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

          <BlogList key={refreshKey} onEdit={(id) => setEditingPostId(id)} />
        </div>
      </div>

      <BlogHelp />
    </div>
  )
}

export default BlogManager
