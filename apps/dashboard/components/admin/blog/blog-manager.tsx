'use client'

import { useState } from 'react'

import { Plus } from 'lucide-react'

import { Panel } from '@/components/layout/page-kit'
import { Button } from '@/components/ui/button'

import { BlogEditor } from './blog-editor'
import { BlogList } from './blog-list'

export function BlogManager() {
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      {editingPostId !== null && (
        <Panel title={editingPostId ? 'Edit post' : 'New post'}>
          <BlogEditor
            key={editingPostId || 'new'}
            postId={editingPostId || undefined}
            onSaved={() => {
              setEditingPostId(null)
              setRefreshKey((k) => k + 1)
            }}
            onCancel={() => setEditingPostId(null)}
          />
        </Panel>
      )}

      <Panel
        flush
        title="Posts"
        description={
          <>
            Write in Markdown. Published posts appear on{' '}
            <a href="/blog" className="text-primary hover:underline">
              /blog
            </a>
            .
          </>
        }
        actions={
          editingPostId === null && (
            <Button size="sm" onClick={() => setEditingPostId('')}>
              <Plus className="mr-1.5 h-4 w-4" />
              New post
            </Button>
          )
        }
      >
        <BlogList key={refreshKey} onEdit={(id) => setEditingPostId(id)} />
      </Panel>
    </>
  )
}

export default BlogManager
