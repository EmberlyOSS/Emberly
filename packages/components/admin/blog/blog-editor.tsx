'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, FileText, Save, X } from 'lucide-react'

import { markdown } from '@codemirror/lang-markdown'
import CodeMirror from '@uiw/react-codemirror'
import MarkdownRenderer from '@/packages/components/shared/MarkdownRenderer'

import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { useToast } from '@/packages/hooks/use-toast'

type Props = {
  postId?: string
  onSaved?: () => void
  onCancel?: () => void
}

export function BlogEditor({ postId, onSaved, onCancel }: Props) {
  const { toast } = useToast()
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [status, setStatus] = useState('DRAFT')
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
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

      toast({
        title: postId ? 'Post updated' : 'Post created',
        description: `Successfully ${postId ? 'updated' : 'created'} the post.`,
      })
      onSaved?.()
    } catch (err) {
      toast({
        title: 'Error',
        description: String(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="glass-subtle overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{postId ? 'Edit Post' : 'New Post'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="gap-2"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide Preview' : 'Preview'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Title & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              className="bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-friendly-slug"
              className="bg-background/50 border-border/50 focus:border-primary/50 font-mono text-sm"
            />
          </div>
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt" className="text-sm font-medium">Excerpt</Label>
          <Input
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary for previews"
            className="bg-background/50 border-border/50 focus:border-primary/50"
          />
        </div>

        {/* Editor & Preview */}
        <div className={`grid gap-4 ${showPreview ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Content (Markdown)</Label>
            <div className="glass-subtle overflow-hidden">
              <CodeMirror
                value={content}
                height="320px"
                extensions={[markdown()]}
                onChange={(value) => setContent(value)}
                theme="dark"
                className="text-foreground"
              />
            </div>
          </div>

          {showPreview && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="glass-subtle p-4 h-[320px] overflow-auto prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer>{content || '*Nothing to preview*'}</MarkdownRenderer>
              </div>
            </div>
          )}
        </div>

        {/* Status & Actions */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="status" className="text-sm font-medium whitespace-nowrap">Status:</Label>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="publishedAt" className="text-sm font-medium whitespace-nowrap">Publish Date:</Label>
            <Input
              id="publishedAt"
              type="datetime-local"
              value={publishedAt || ''}
              onChange={(e) => setPublishedAt(e.target.value || null)}
              className="w-auto bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => onCancel?.()} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {postId ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default BlogEditor
