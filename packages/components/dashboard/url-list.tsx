'use client'

import { useCallback, useEffect, useState } from 'react'

import { Copy, Trash2 } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Skeleton } from '@/packages/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/packages/components/ui/table'

import { writeToClipboard } from '@/packages/lib/utils/clipboard'

import { useToast } from '@/packages/hooks/use-toast'

interface ShortenedUrl {
  id: string
  shortCode: string
  targetUrl: string
  clicks: number
  createdAt: string
}

interface URLListProps {
  refreshTrigger?: number
}

function URLTableSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground/80">Original URL</TableHead>
            <TableHead className="text-muted-foreground/80">Short URL</TableHead>
            <TableHead className="text-right text-muted-foreground/80">Clicks</TableHead>
            <TableHead className="text-right text-muted-foreground/80">Created</TableHead>
            <TableHead className="text-right text-muted-foreground/80">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i} className="border-border/30">
              <TableCell>
                <Skeleton className="h-4 w-[250px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[180px]" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-8 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-24 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function URLList({ refreshTrigger = 0 }: URLListProps) {
  const [urls, setUrls] = useState<ShortenedUrl[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchUrls = useCallback(async () => {
    try {
      const response = await fetch('/api/urls')
      if (!response.ok) throw new Error('Failed to fetch URLs')
      const data = await response.json()
      setUrls(data.data?.urls || [])
    } catch (error) {
      console.error('Failed to load URLs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load shortened URLs',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const copyUrl = async (shortCode: string) => {
    const url = `${window.location.origin}/u/${shortCode}`
    try {
      await writeToClipboard(url)
      toast({
        title: 'URL copied',
        description: 'Shortened URL has been copied to clipboard',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy URL',
        variant: 'destructive',
      })
    }
  }

  const deleteUrl = async (id: string) => {
    try {
      const response = await fetch(`/api/urls/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete URL')

      setUrls(urls.filter((url) => url.id !== id))

      toast({
        title: 'URL deleted',
        description: 'Shortened URL has been deleted',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete URL',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    fetchUrls()
  }, [refreshTrigger, fetchUrls])

  if (isLoading) {
    return <URLTableSkeleton />
  }

  if (urls.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-lg p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
          <Copy className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <p className="text-muted-foreground font-medium">No shortened URLs yet</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Create your first shortened URL above</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground/80 font-medium">Original URL</TableHead>
            <TableHead className="text-muted-foreground/80 font-medium">Short URL</TableHead>
            <TableHead className="text-right text-muted-foreground/80 font-medium">Clicks</TableHead>
            <TableHead className="text-right text-muted-foreground/80 font-medium">Created</TableHead>
            <TableHead className="text-right text-muted-foreground/80 font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {urls.map((url) => (
            <TableRow key={url.id} className="border-border/50 hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium max-w-[300px] truncate text-foreground/90">
                {url.targetUrl}
              </TableCell>
              <TableCell className="text-primary/80 font-mono text-sm">{`${window.location.origin}/u/${url.shortCode}`}</TableCell>
              <TableCell className="text-right">
                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {url.clicks}
                </span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">
                {new Date(url.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyUrl(url.shortCode)}
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteUrl(url.id)}
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
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
