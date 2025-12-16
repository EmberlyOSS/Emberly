'use client'

import { useEffect, useState } from 'react'

import { markdown } from '@codemirror/lang-markdown'
import CodeMirror from '@uiw/react-codemirror'
import MarkdownRenderer from '@/components/docs/MarkdownRenderer'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  postId?: string
  onSaved?: () => void
  onCancel?: () => void
}

export function BlogEditor({ postId, onSaved, onCancel }: Props) {
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [status, setStatus] = useState('DRAFT')
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!postId) {
      setSlug('')
      setTitle('')
      setContent('')
      setExcerpt('')
      setStatus('DRAFT')
      setPublishedAt(null)
      return
    }

    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/posts/${postId}?admin=true`, {
          credentials: 'include',
        })
        const json = await res.json()
        const p = json.data
        setSlug(p.slug || '')
        setTitle(p.title || '')
        setContent(p.content || '')
        setExcerpt(p.excerpt || '')
        setStatus(p.status || 'DRAFT')
        setPublishedAt(p.publishedAt || null)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [postId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        slug,
        title,
        content,
        excerpt,
        status,
        publishedAt: publishedAt || null,
      }
      let res
      if (postId) {
        res = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        })
      } else {
        res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        })
      }

      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error || 'Save failed')
      }

      onSaved?.()
    } catch (err) {
      alert(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="p-4 border rounded-lg bg-background/50"
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full"
          />
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug (url-friendly)"
            className="w-full"
          />
        </div>

        <div>
          <Input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Excerpt"
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-md overflow-hidden bg-background/60">
            <div className="px-3 py-2 bg-muted/10 border-b">
              Editor (Markdown)
            </div>
            <div className="p-2">
              <CodeMirror
                value={content}
                height="320px"
                extensions={[markdown()]}
                onChange={(value) => setContent(value)}
                theme="dark"
                className="text-foreground rounded"
              />
            </div>
          </div>

          <div className="border rounded-md overflow-hidden bg-background/60">
            <div className="px-3 py-2 bg-muted/10 border-b">Preview</div>
            <div className="p-4 prose max-w-none overflow-auto">
              <MarkdownRenderer>{content || '*Nothing to preview*'}</MarkdownRenderer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:flex md:items-center md:space-x-4">
          <Select value={status} onValueChange={(v) => setStatus(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="datetime-local"
            value={publishedAt || ''}
            onChange={(e) => setPublishedAt(e.target.value || null)}
            className="w-56"
          />

          <div className="ml-auto flex items-center space-x-2">
            <button type="button" className="btn" onClick={() => onCancel?.()}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {postId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default BlogEditor
