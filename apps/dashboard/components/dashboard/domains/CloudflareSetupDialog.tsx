'use client'

import React, { useState } from 'react'
import { AlertTriangle, ExternalLink, Loader2, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Conflict {
  type: string
  name: string
  content: string
}

interface Props {
  domainId: string
  domain: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after records are created so verification can be re-run */
  onConfigured: () => void
}

export function CloudflareSetupDialog({
  domainId,
  domain,
  open,
  onOpenChange,
  onConfigured,
}: Props) {
  const { toast } = useToast()
  const [token, setToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null)

  const reset = () => {
    // The token only ever lives in this input's state; clear it on every exit
    setToken('')
    setError(null)
    setConflicts(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const submit = async (replaceConflicts: boolean) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/domains/${domainId}/cloudflare-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken: token, replaceConflicts }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 409 && Array.isArray(data.conflicts)) {
        setConflicts(data.conflicts)
        return
      }
      if (!res.ok) {
        setError(data.error || 'Could not configure DNS')
        return
      }

      toast({
        title: 'DNS records added',
        description: data.created?.length
          ? `Added ${data.created.length} record(s) in ${data.zone}. Checking verification now.`
          : `Everything was already in place in ${data.zone}. Checking verification now.`,
      })
      handleOpenChange(false)
      onConfigured()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set up {domain} with Cloudflare</DialogTitle>
          <DialogDescription>
            If {domain} uses Cloudflare for DNS, we can add the records for you.
          </DialogDescription>
        </DialogHeader>

        {conflicts ? (
          <div className="space-y-3">
            <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <p>
                These existing records are in the way and will be{' '}
                <strong>deleted</strong> and replaced. Anything currently served
                from them will stop working.
              </p>
            </div>
            <ul className="space-y-1.5">
              {conflicts.map((c, i) => (
                <li
                  key={i}
                  className="rounded-md bg-muted/40 px-3 py-2 font-mono text-xs break-all"
                >
                  {c.type} {c.name} → {c.content}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>
                Open{' '}
                <a
                  href="https://dash.cloudflare.com/profile/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                >
                  Cloudflare API Tokens
                  <ExternalLink className="h-3 w-3" />
                </a>{' '}
                and click <strong>Create Token</strong>.
              </li>
              <li>
                Use the <strong>Edit zone DNS</strong> template, then add a
                second permission: <strong>Zone → Zone → Read</strong>.
              </li>
              <li>
                Under <strong>Zone Resources</strong>, choose{' '}
                <strong>Specific zone</strong> and pick the zone for {domain}.
              </li>
              <li>
                Optionally set the <strong>TTL</strong> end date to today so the
                token expires on its own.
              </li>
              <li>Create the token and paste it below.</li>
            </ol>

            <div className="space-y-2">
              <Label htmlFor="cf-token">Cloudflare API token</Label>
              <Input
                id="cf-token"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your token"
              />
            </div>

            <div className="flex gap-2 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <p>
                Your token is used once to add the DNS records for {domain} and
                is never saved or logged. You can delete it in Cloudflare as
                soon as this finishes.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => submit(Boolean(conflicts))}
            disabled={submitting || token.trim().length < 20}
            variant={conflicts ? 'destructive' : 'default'}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {conflicts ? 'Replace and continue' : 'Add records'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
