'use client'

import { useCallback, useEffect, useState } from 'react'

import { Check, Copy, Eye, EyeOff, KeyRound, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Separator } from '@/packages/components/ui/separator'
import { useToast } from '@/packages/hooks/use-toast'
import { useUploadToken } from '@/packages/hooks/use-upload-token'

type ApiKey = {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  createdAt: string
}

export function ApiKeysPanel() {
  const { toast } = useToast()
  const {
    uploadToken,
    isLoadingToken,
    showToken,
    setShowToken,
    handleRefreshToken,
  } = useUploadToken()
  const [keys, setKeys] = useState<ApiKey[] | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const loadKeys = useCallback(async () => {
    try {
      const res = await fetch(`/api/profile/api-keys?t=${Date.now()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setKeys(data.keys ?? [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load API keys', variant: 'destructive' })
    }
  }, [toast])

  useEffect(() => { void loadKeys() }, [loadKeys])

  const createKey = async () => {
    if (!newKeyName.trim()) return
    setCreatingKey(true)
    try {
      const res = await fetch('/api/profile/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to create key')
      }
      const data = await res.json()
      setCreatedKey(data.key)
      setNewKeyName('')
      await loadKeys()
      toast({ title: 'Created', description: 'API key created — copy it now, it won\'t be shown again.' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setCreatingKey(false)
    }
  }

  const revokeKey = async (keyId: string) => {
    try {
      const res = await fetch(`/api/profile/api-keys/${keyId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setKeys((prev) => prev?.filter((k) => k.id !== keyId) ?? null)
      toast({ title: 'Revoked', description: 'API key has been revoked.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke key', variant: 'destructive' })
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
    toast({ title: 'Copied', description: `${label} copied to clipboard` })
  }

  return (
    <div className="space-y-6">
      {/* Legacy Upload Token */}
      <div className="space-y-2">
        <Label>Upload Token</Label>
        <p className="text-sm text-muted-foreground">
          Your legacy upload token. Works with ShareX and other upload tools. Consider migrating to a named API key instead.
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
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="outline" onClick={handleRefreshToken} disabled={isLoadingToken}>
            {isLoadingToken ? 'Refreshing...' : 'Refresh Token'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Named API Keys */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-4 w-4 text-primary" />
          <h4 className="font-medium">Your API Keys</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          Named keys for ShareX, scripts, CI/CD, and external integrations. Keys start with{' '}
          <code className="text-xs bg-black/20 px-1.5 py-0.5 rounded">ebk_</code> and can be used throughout the entire Emberly API.
        </p>
      </div>

      {/* Created key flash alert */}
      {createdKey && (
        <div className="glass-subtle rounded-xl p-4 border border-chart-2/30 space-y-2">
          <p className="text-sm font-medium text-chart-2">New key created — copy it now! It won't be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono bg-black/20 rounded-lg px-3 py-2 break-all">
              {createdKey}
            </code>
            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createdKey, 'API key')}>
              {copied === 'API key' ? <Check className="h-4 w-4 text-chart-2" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setCreatedKey(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Create new key */}
      <div className="flex gap-3">
        <Input
          placeholder="Key name, e.g. ShareX or CI/CD Pipeline"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createKey()}
          className="max-w-sm bg-muted/30 border-border/50"
        />
        <Button onClick={createKey} disabled={creatingKey || !newKeyName.trim()} className="gap-2">
          <Plus className="h-4 w-4" />
          {creatingKey ? 'Creating…' : 'Create Key'}
        </Button>
      </div>

      {/* Key list */}
      {keys === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No API keys yet. Create one to get started.</p>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between glass-subtle rounded-xl p-4">
              <div className="space-y-0.5">
                <p className="font-medium">{k.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{k.prefix}…</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsedAt && ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => revokeKey(k.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
