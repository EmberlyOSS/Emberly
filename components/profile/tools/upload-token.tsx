'use client'

import { useEffect, useState } from 'react'

import { Eye, EyeOff } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useUploadToken } from '@/hooks/use-upload-token'

const ALLOWED_HOSTS = ['emberly.site', 'embrly.ca']

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

  const combinedDomains = Array.from(
    new Set([...(domains || []), ...ALLOWED_HOSTS])
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Upload Host</Label>
        <Alert variant="destructive" className="text-xs">
          <AlertTitle>Custom domains temporarily disabled</AlertTitle>
          <AlertDescription>
            You can currently select only the default Emberly domains
            (emberly.site or embrly.ca). Custom domains will return soon in the
            next release.
          </AlertDescription>
        </Alert>
        <div className="flex items-center gap-2">
          <select
            value={selected || ''}
            onChange={(e) => setDomain(e.target.value)}
            className="rounded-md border bg-background px-3 py-1 text-sm"
            disabled={loadingDomains}
          >
            <option value="">(default)</option>
            {combinedDomains.map((d) => {
              const isAllowed = ALLOWED_HOSTS.includes(d)
              return (
                <option key={d} value={d} disabled={!isAllowed}>
                  {d}
                  {!isAllowed ? ' (disabled)' : ''}
                </option>
              )
            })}
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
