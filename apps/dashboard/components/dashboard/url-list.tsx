'use client'

import { Copy, ExternalLink, Link2, Trash2 } from 'lucide-react'

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

import { writeToClipboard } from '@/lib/utils/clipboard'

import { useToast } from '@/hooks/use-toast'

export interface ShortenedUrl {
  id: string
  shortCode: string
  targetUrl: string
  domain: string | null
  url: string
  clicks: number
  createdAt: string
}

interface URLListProps {
  urls: ShortenedUrl[]
  isLoading: boolean
  onDeleted?: (id: string) => void
}

const shell =
  'rounded-xl border border-border/50 bg-background/80 backdrop-blur-lg overflow-hidden'

function Header() {
  return (
    <TableHeader>
      <TableRow className="border-border/50 hover:bg-transparent">
        <TableHead>Short link</TableHead>
        <TableHead className="hidden md:table-cell">Goes to</TableHead>
        <TableHead className="text-right">Clicks</TableHead>
        <TableHead className="hidden text-right sm:table-cell">
          Created
        </TableHead>
        <TableHead className="w-24" />
      </TableRow>
    </TableHeader>
  )
}

export function URLList({ urls, isLoading, onDeleted }: URLListProps) {
  const { toast } = useToast()

  const copyUrl = async (url: string) => {
    try {
      await writeToClipboard(url)
      toast({ title: 'Link copied', description: url })
    } catch {
      toast({ title: "Couldn't copy the link", variant: 'destructive' })
    }
  }

  const deleteUrl = async (id: string) => {
    try {
      const response = await fetch(`/api/urls/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      onDeleted?.(id)
      toast({ title: 'Short link deleted' })
    } catch {
      toast({ title: "Couldn't delete the link", variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className={shell}>
        <Table>
          <Header />
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i} className="border-border/30">
                <TableCell>
                  <Skeleton className="h-4 w-44" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-56" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-4 w-8" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="ml-auto h-4 w-20" />
                </TableCell>
                <TableCell />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (urls.length === 0) {
    return (
      <div className={`${shell} p-12 text-center`}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
          <Link2 className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <p className="font-medium text-muted-foreground">No short links yet</p>
        <p className="mt-1 text-sm text-muted-foreground/60">
          Paste a URL above to create one.
        </p>
      </div>
    )
  }

  return (
    <div className={shell}>
      <Table>
        <Header />
        <TableBody>
          {urls.map((url) => (
            <TableRow
              key={url.id}
              className="border-border/50 transition-colors hover:bg-muted/30"
            >
              <TableCell className="max-w-[16rem]">
                <a
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-mono text-sm text-primary hover:underline"
                >
                  {url.url.replace(/^https?:\/\//, '')}
                </a>
                <p className="truncate text-xs text-muted-foreground md:hidden">
                  {url.targetUrl}
                </p>
              </TableCell>
              <TableCell className="hidden max-w-[22rem] md:table-cell">
                <span
                  className="block truncate text-sm text-foreground/80"
                  title={url.targetUrl}
                >
                  {url.targetUrl}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {url.clicks}
              </TableCell>
              <TableCell className="hidden text-right text-sm text-muted-foreground sm:table-cell">
                {new Date(url.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyUrl(url.url)}
                    className="h-8 w-8"
                    aria-label="Copy short link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="hidden h-8 w-8 sm:inline-flex"
                  >
                    <a
                      href={url.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open destination"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteUrl(url.id)}
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete short link"
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
