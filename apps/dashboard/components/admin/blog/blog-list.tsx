'use client'

import { useEffect, useState } from 'react'
import { Edit2, FileText, Trash2 } from 'lucide-react'

import { EmptyState, StatusBadge } from '@/components/layout/page-kit'
import { humanize } from '@/lib/utils/humanize'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">
              Title
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Slug
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Status
            </TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">
              Published
            </TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">
              Actions
            </TableHead>
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
      return <StatusBadge tone="success">Published</StatusBadge>
    case 'ARCHIVED':
      return <StatusBadge tone="neutral">Archived</StatusBadge>
    case 'DRAFT':
      return <StatusBadge tone="warning">Draft</StatusBadge>
    default:
      return <StatusBadge>{humanize(status)}</StatusBadge>
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
    toast({
      title: 'Delete this post?',
      description: 'This cannot be undone.',
      variant: 'destructive',
      action: (
        <ToastAction
          altText="Confirm delete"
          onClick={async () => {
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
          }}
        >
          Delete
        </ToastAction>
      ),
    })
  }

  if (loading) return <PostTableSkeleton />

  if (!loading && posts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No posts yet"
        description="Write your first post to share news and updates."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">
              Title
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Slug
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Status
            </TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">
              Published
            </TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">
              Actions
            </TableHead>
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
              <TableCell className="max-w-[220px] truncate text-muted-foreground font-mono text-sm">
                {p.slug}
              </TableCell>
              <TableCell>{getStatusBadge(p.status)}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {p.publishedAt
                  ? new Date(p.publishedAt).toLocaleDateString()
                  : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.(p.id)}
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    aria-label="Edit post"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(p.id)}
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete post"
                  >
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
