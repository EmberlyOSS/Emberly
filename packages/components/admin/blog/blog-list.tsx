"use client"

import { useEffect, useState } from 'react'
import { Edit2, FileText, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Badge } from '@/packages/components/ui/badge'
import { Skeleton } from '@/packages/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/packages/components/ui/table'
import { useToast } from '@/packages/hooks/use-toast'

type Post = {
  id: string
  title: string
  slug: string
  status: string
  publishedAt?: string | null
  excerpt?: string | null
}

function PostTableSkeleton() {
  return (
    <div className="glass-subtle overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">Title</TableHead>
            <TableHead className="text-muted-foreground font-medium">Slug</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Published</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i} className="border-border/50">
              <TableCell>
                <Skeleton className="h-4 w-[220px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[120px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-24 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PUBLISHED':
      return <Badge className="bg-chart-2/20 text-chart-2 hover:bg-chart-2/30 border-0">Published</Badge>
    case 'DRAFT':
      return <Badge variant="secondary" className="bg-muted/50">Draft</Badge>
    case 'ARCHIVED':
      return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function BlogList({ onEdit }: { onEdit?: (id: string) => void }) {
  const { toast } = useToast()
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
      toast({
        title: 'Post deleted',
        description: 'The post has been deleted successfully.',
      })
      await load()
    } catch (e) {
      toast({
        title: 'Error',
        description: String(e),
        variant: 'destructive',
      })
    }
  }

  if (loading) return <PostTableSkeleton />

  if (!loading && posts.length === 0) {
    return (
      <div className="glass-subtle border-dashed p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Start creating blog posts to share news and updates with your audience.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-subtle overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">Title</TableHead>
            <TableHead className="text-muted-foreground font-medium">Slug</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Published</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((p) => (
            <TableRow key={p.id} className="border-border/50 group">
              <TableCell className="font-medium max-w-[350px]">
                <div className="truncate">{p.title}</div>
                {p.excerpt && (
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {p.excerpt}
                  </div>
                )}
              </TableCell>
              <TableCell className="max-w-[220px] truncate text-muted-foreground font-mono text-sm">{p.slug}</TableCell>
              <TableCell>{getStatusBadge(p.status)}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => onEdit?.(p.id)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default BlogList
