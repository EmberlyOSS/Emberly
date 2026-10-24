'use client'

import { useEffect, useState } from 'react'

import {
  Archive,
  Check,
  Eye,
  EyeOff,
  MessageSquareQuote,
  MoreHorizontal,
  RefreshCw,
  Star,
  Trash2,
  X,
} from 'lucide-react'

import { EmptyState, Panel, StatusBadge } from '@/components/layout/page-kit'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

function TestimonialSkeleton() {
  return (
    <Panel flush title="Testimonials">
      <div className="divide-y divide-border/50">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2 px-5 py-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function TestimonialList() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/testimonials?all=true')
      const payload = await res.json()
      const value = Array.isArray(payload) ? payload : payload?.data
      setItems(Array.isArray(value) ? value : [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function approve(id: string, approved: boolean) {
    await fetch(`/api/testimonials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    })
    load()
  }

  async function toggleArchive(id: string, archived: boolean) {
    await fetch(`/api/testimonials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    })
    load()
  }

  async function toggleHidden(id: string, hidden: boolean) {
    await fetch(`/api/testimonials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden }),
    })
    load()
  }

  async function remove(id: string) {
    toast({
      title: 'Delete testimonial?',
      description: 'This cannot be undone.',
      variant: 'destructive',
      action: (
        <ToastAction
          altText="Confirm delete"
          onClick={async () => {
            await fetch(`/api/testimonials/${id}`, { method: 'DELETE' })
            load()
          }}
        >
          Delete
        </ToastAction>
      ),
    })
  }

  if (loading) return <TestimonialSkeleton />

  const getStatusBadge = (item: any) => {
    if (item.archived) return <StatusBadge>Archived</StatusBadge>
    if (item.hidden) return <StatusBadge>Hidden</StatusBadge>
    if (!item.approved) return <StatusBadge tone="warning">Pending</StatusBadge>
    return <StatusBadge tone="success">Approved</StatusBadge>
  }

  return (
    <Panel
      flush
      title={`${items.length} ${items.length === 1 ? 'testimonial' : 'testimonials'}`}
      description="Approved testimonials can be shown on the site."
      actions={
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => load()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="No testimonials yet"
          description="Testimonials appear here once users submit them."
        />
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((t) => (
            <li key={t.id} className="flex items-start gap-4 px-5 py-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {t.user?.name ?? t.user?.urlId}
                  </span>
                  {t.rating ? (
                    <span className="flex items-center gap-0.5 text-sm text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {t.rating}
                    </span>
                  ) : null}
                  {getStatusBadge(t)}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {t.content}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!t.approved && !t.archived && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => approve(t.id, true)}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Approve
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {t.approved && (
                      <DropdownMenuItem
                        onClick={() => approve(t.id, false)}
                        className="cursor-pointer"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Unapprove
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => toggleHidden(t.id, !t.hidden)}
                      className="cursor-pointer"
                    >
                      {t.hidden ? (
                        <Eye className="mr-2 h-4 w-4" />
                      ) : (
                        <EyeOff className="mr-2 h-4 w-4" />
                      )}
                      {t.hidden ? 'Unhide' : 'Hide'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toggleArchive(t.id, !t.archived)}
                      className="cursor-pointer"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      {t.archived ? 'Unarchive' : 'Archive'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => remove(t.id)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export default TestimonialList
