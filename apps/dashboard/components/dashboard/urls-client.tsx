'use client'

import { useCallback, useEffect, useState } from 'react'

import { URLForm } from '@/components/dashboard/url-form'
import { type ShortenedUrl, URLList } from '@/components/dashboard/url-list'

import { useToast } from '@/hooks/use-toast'

export function URLsClient({ mainHost }: { mainHost: string }) {
  const [urls, setUrls] = useState<ShortenedUrl[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [defaultDomain, setDefaultDomain] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/urls')
      if (!response.ok) throw new Error()
      const { data } = await response.json()
      setUrls(data?.urls ?? [])
      setDomains(data?.domains ?? [])
      setDefaultDomain(data?.defaultDomain ?? null)
    } catch {
      toast({
        title: "Couldn't load your short links",
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <URLForm
        mainHost={mainHost}
        domains={domains}
        defaultDomain={defaultDomain}
        onCreated={(url) => setUrls((prev) => [url, ...prev])}
      />
      <URLList
        urls={urls}
        isLoading={isLoading}
        onDeleted={(id) => setUrls((prev) => prev.filter((u) => u.id !== id))}
      />
    </div>
  )
}
