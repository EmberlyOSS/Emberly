'use client'

import { useEffect, useState } from 'react'

import { z } from 'zod'

import type { ShortenedUrl } from '@/components/dashboard/url-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { writeToClipboard } from '@/lib/utils/clipboard'

import { useToast } from '@/hooks/use-toast'

const urlSchema = z.string().url('Enter a full URL, starting with https://')

const MAIN = '__main__'

interface URLFormProps {
  mainHost: string
  domains: string[]
  defaultDomain: string | null
  onCreated?: (url: ShortenedUrl) => void
}

export function URLForm({
  mainHost,
  domains,
  defaultDomain,
  onCreated,
}: URLFormProps) {
  const [url, setUrl] = useState('')
  const [domain, setDomain] = useState(MAIN)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setDomain(defaultDomain ?? MAIN)
  }, [defaultDomain])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = urlSchema.safeParse(url.trim())
    if (!parsed.success) {
      toast({
        title: 'Invalid URL',
        description: parsed.error.issues[0].message,
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: parsed.data,
          domain: domain === MAIN ? null : domain,
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.error || "Couldn't shorten that URL")
      }

      const created: ShortenedUrl = body.data
      onCreated?.(created)
      setUrl('')

      const copied = await writeToClipboard(created.url)
        .then(() => true)
        .catch(() => false)
      toast({
        title: 'Short link created',
        description: copied ? `${created.url} (copied)` : created.url,
      })
    } catch (error) {
      toast({
        title: "Couldn't shorten that URL",
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor="url" className="text-sm font-medium">
        URL to shorten
      </Label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="url"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://example.com/very-long-url-to-shorten"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="flex-1 bg-background/80"
        />
        {domains.length > 0 && (
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger
              className="bg-background/80 sm:w-56"
              aria-label="Domain for the short link"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MAIN}>{mainHost}</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button type="submit" disabled={isLoading} className="px-6">
          {isLoading ? 'Shortening…' : 'Shorten'}
        </Button>
      </div>
      {domains.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Short links work on any of your verified domains.
        </p>
      )}
    </form>
  )
}
