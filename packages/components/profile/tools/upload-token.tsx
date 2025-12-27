'use client'

import { useEffect, useState } from 'react'

import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'

import { useUploadToken } from '@/packages/hooks/use-upload-token'

export function UploadToken() {
  const {
    uploadToken,
    isLoadingToken,
    showToken,
    setShowToken,
    handleRefreshToken,
  } = useUploadToken()

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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Upload Host</Label>
        <div className="flex items-center gap-2">
          <select
            value={selected || ''}
            onChange={(e) => setDomain(e.target.value)}
            className="rounded-md border bg-background px-3 py-1 text-sm"
            disabled={loadingDomains}
          >
            <option value="">(default)</option>
            {(domains || []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDomain('')}
            disabled={loadingDomains}
          >
            Reset
          </Button>
        </div>
        <Label>Upload Token</Label>
        <p className="text-sm text-muted-foreground">
          This token is used to authenticate your uploads. Keep it secret and
          refresh it if it gets compromised.
        </p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={uploadToken || ''}
              readOnly
              type={showToken ? 'text' : 'password'}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleRefreshToken}
            disabled={isLoadingToken}
          >
            {isLoadingToken ? 'Refreshing...' : 'Refresh Token'}
          </Button>
        </div>
      </div>
    </div>
  )
}
