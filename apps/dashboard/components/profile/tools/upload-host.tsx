'use client'

import { useEffect, useState } from 'react'

import { RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function UploadHost() {
  const [domains, setDomains] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loadingDomains, setLoadingDomains] = useState(false)

  useEffect(() => {
    const fetchDomains = async () => {
      setLoadingDomains(true)
      try {
        const res = await fetch('/api/profile/upload-domain')
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setDomains(data.domains || [])
        setSelected(data.selected || null)
      } catch (e) {
        // ignore
      } finally {
        setLoadingDomains(false)
      }
    }
    fetchDomains()
  }, [])

  const setDomain = async (domain: string) => {
    try {
      const res = await fetch('/api/profile/upload-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSelected(data.selected || domain)
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="space-y-2">
      <Label>Upload Host</Label>
      <p className="text-sm text-muted-foreground">
        Choose which domain your uploaded files are served from.
      </p>
      <div className="flex items-center gap-2 max-w-sm">
        <Select
          value={selected || ''}
          onValueChange={setDomain}
          disabled={loadingDomains}
        >
          <SelectTrigger className="w-full bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:ring-primary/20">
            <SelectValue placeholder="Select a host" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">(default)</SelectItem>
            {(domains || []).map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && selected !== 'default' && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDomain('')}
            disabled={loadingDomains}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            title="Reset to default"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
